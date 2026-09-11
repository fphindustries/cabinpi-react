import { beforeAll, afterAll, describe, expect, it, vi } from 'vitest';
import { Miniflare, convertV4MiniflareOptions, Headers as RuntimeHeaders } from 'miniflare';
import { readFile } from 'node:fs/promises';
import { listPhotos, photoFromKey, readPhoto } from '../server/photos';
import { latestSensor, querySensors } from '../server/sensors';

const mf = new Miniflare(convertV4MiniflareOptions({ modules: true, script: 'export default { fetch() { return new Response("test"); } }',
  compatibilityDate: '2026-09-09', d1Databases: ['DB'], r2Buckets: ['PHOTOS'] }));
let bucket: Awaited<ReturnType<typeof mf.getR2Bucket>>;
let db: Awaited<ReturnType<typeof mf.getD1Database>>;
const photoKey = '2026/09/08/Fire_Pit-2026-09-08-19-41.jpg';

beforeAll(async () => {
  vi.stubGlobal('Headers', RuntimeHeaders);
  bucket = await mf.getR2Bucket('PHOTOS');
  db = await mf.getD1Database('DB');
  for (const file of ['0001_create_measurements_table.sql', '0002_add_dc_power_and_basement_fields.sql']) {
    const sql = await readFile(`migrations/${file}`, 'utf8');
    for (const statement of sql.split(';').filter(sql => sql.trim())) await db.prepare(statement).run();
  }
  await bucket.put(photoKey, 'photo bytes', { httpMetadata: { contentType: 'image/jpeg', cacheControl: 'public' } });
  // Lexicographic camera grouping, nested folders, more than one R2 page.
  for (let index = 0; index < 103; index++) {
    await bucket.put(`2026/09/09/Camera_${String(index).padStart(3, '0')}-2026-09-09-10-00.jpg`, 'image');
  }
  await bucket.put('2026/09/10/readme.txt', 'not an image');
  await bucket.put('2026/09/09/private.json', '{}');
  await db.batch([
    db.prepare('INSERT INTO measurements (date, watts, windAvg, inverterOn, inverterFault, inverterVacOut, inverterAacOut) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)')
      .bind('2026-09-09T10:00:00', 0, 0, 0, 2, null, null),
    db.prepare('INSERT INTO measurements (date, watts, inverterOn, inverterFault, inverterVacOut, inverterAacOut) VALUES (?1, ?2, ?3, ?4, ?5, ?6)')
      .bind('2026-09-09T11:00:00', 100, 1, 0, 120, 0),
  ]);
});
afterAll(async () => { await mf.dispose(); vi.unstubAllGlobals(); });

describe('R2 photos', () => {
  it('uses capture time from the filename, not upload time', () => {
    expect(photoFromKey(photoKey)).toMatchObject({ camera: 'Fire Pit', timestamp: '2026-09-08T19:41:00', key: photoKey });
    expect(photoFromKey('2026/09/09/Fire_Pit-2026-09-08-19-41.jpg')).toBeNull();
    expect(photoFromKey('2026/02/30/Parking-2026-02-30-19-41.jpg')).toBeNull();
  });
  it('finds the latest populated photo date and preserves every page', async () => {
    const first = await listPhotos(bucket, new URLSearchParams());
    expect(first.date).toBe('2026-09-09');
    expect(first.count).toBe(100);
    expect(first.cursor).toBeTruthy();
    const next = await listPhotos(bucket, new URLSearchParams({ date: first.date!, cursor: first.cursor! }));
    expect(next.count).toBe(3);
    expect(next.cursor).toBeNull();
    expect(new Set([...first.photos, ...next.photos].map(photo => photo.key)).size).toBe(103);
  });
  it('returns four newest captures even when they span several dates', async () => {
    await bucket.put('2026/09/10/Fire_Pit-2026-09-10-08-00.jpg', 'image');
    await bucket.put('2026/09/10/Parking-2026-09-10-10-00.jpg', 'image');
    await bucket.put('2026/09/10/Marks_Cabin-2026-09-10-09-00.jpg', 'image');
    const recent = await listPhotos(bucket, new URLSearchParams({ recent: '4' }));
    expect(recent).toMatchObject({ count: 4, date: '2026-09-10', cursor: null });
    expect(recent.photos.map(photo => photo.timestamp)).toEqual([
      '2026-09-10T10:00:00', '2026-09-10T09:00:00', '2026-09-10T08:00:00', '2026-09-09T10:00:00',
    ]);
    await expect(listPhotos(bucket, new URLSearchParams({ recent: '3' }))).rejects.toMatchObject({ status: 400 });
  });
  it('returns a useful empty date and validates input', async () => {
    expect(await listPhotos(bucket, new URLSearchParams({ date: '2020-01-01' }))).toMatchObject({ photos: [], date: '2020-01-01', cursor: null });
    await expect(listPhotos(bucket, new URLSearchParams({ date: '2026-02-30' }))).rejects.toMatchObject({ status: 400 });
    await expect(listPhotos(bucket, new URLSearchParams({ cursor: 'oops' }))).rejects.toMatchObject({ status: 400 });
    await expect(readPhoto(bucket, '2026/09/09/private.json', new Request('http://localhost'))).rejects.toMatchObject({ status: 404 });
    await expect(readPhoto(bucket, '2026/09/09/Missing-2026-09-09-00-00.jpg', new Request('http://localhost'))).rejects.toMatchObject({ status: 404 });
  });
  it('streams private images with working conditional GET and HEAD', async () => {
    const response = await readPhoto(bucket, photoKey, new Request('http://localhost'));
    expect(await response.text()).toBe('photo bytes');
    expect(response.headers.get('Cache-Control')).toContain('private');
    expect(response.headers.get('Content-Type')).toBe('image/jpeg');
    const etag = response.headers.get('ETag')!;
    const cached = await readPhoto(bucket, photoKey, new Request('http://localhost', { headers: { 'If-None-Match': etag } }));
    expect(cached.status).toBe(304);
    expect(await cached.text()).toBe('');
    const head = await readPhoto(bucket, photoKey, new Request('http://localhost', { method: 'HEAD' }));
    expect(await head.text()).toBe('');
    expect(head.headers.get('Content-Length')).toBe('11');
  });
});

describe('D1 sensors', () => {
  it('uses the date index without a temporary sort for latest and range reads', async () => {
    const latest = await db.prepare('EXPLAIN QUERY PLAN SELECT * FROM measurements ORDER BY date DESC LIMIT 1').all<{ detail: string }>();
    const range = await db.prepare('EXPLAIN QUERY PLAN SELECT * FROM measurements WHERE date >= ?1 AND date <= ?2 ORDER BY date DESC LIMIT ?3')
      .bind('2026-09-09T00:00:00', '2026-09-09T23:59:59', 1001).all<{ detail: string }>();
    for (const plan of [latest, range]) {
      const details = plan.results.map(row => row.detail).join('\n');
      expect(details).toContain('idx_measurements_date');
      expect(details).not.toMatch(/TEMP B-TREE/i);
    }
  });
  it('maps persisted readings, including zeros and nulls', async () => {
    const latest = await latestSensor(db);
    expect(latest.data).toMatchObject({ watts: 100, inverterOn: true, inverterAacOut: 0, basementF: null });
    const params = new URLSearchParams({ start: '2026-09-09T00:00:00', stop: '2026-09-09T23:59:59' });
    const result = await querySensors(db, params);
    expect(result.data[1]).toMatchObject({ watts: 0, windAvg: 0, inverterOn: false, inverterVacOut: null, inverterAacOut: null });
    expect((await querySensors(db, params, true)).data[0]).toMatchObject({ date: '2026-09-09', watts: 100 });
    params.set('limit', '1');
    expect(await querySensors(db, params)).toMatchObject({ count: 1, truncated: true });
    params.set('limit', '10garbage');
    await expect(querySensors(db, params)).rejects.toMatchObject({ status: 400 });
  });
});
