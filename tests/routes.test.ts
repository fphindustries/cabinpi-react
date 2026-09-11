import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';
import { readFile } from 'node:fs/promises';

const mf = new Miniflare(convertV4MiniflareOptions({
  modules: true, scriptPath: '.wrangler/build/index.js', compatibilityDate: '2026-09-09',
  d1Databases: ['cabinpi_db'], r2Buckets: ['PHOTOS'],
  bindings: { ACCESS_TEAM_DOMAIN: 'https://fphi.cloudflareaccess.com', ACCESS_AUD: 'test-audience' },
}));
const key = '2026/09/08/Test_Camera-2026-09-08-19-41.png';
beforeAll(async () => {
  const db = await mf.getD1Database('cabinpi_db');
  for (const file of ['0001_create_measurements_table.sql', '0002_add_dc_power_and_basement_fields.sql']) {
    for (const sql of (await readFile(`migrations/${file}`, 'utf8')).split(';').filter(sql => sql.trim())) await db.prepare(sql).run();
  }
  await db.batch([
    db.prepare('INSERT INTO measurements (date, watts, inverterOn) VALUES (?1, ?2, ?3)').bind('2026-09-08T10:00:00', 0, 0),
    db.prepare('INSERT INTO measurements (date, watts, inverterOn, inverterVacOut) VALUES (?1, ?2, ?3, ?4)').bind('2026-09-08T11:00:00', 100, 1, 120),
  ]);
  const bucket = await mf.getR2Bucket('PHOTOS');
  await bucket.put(key, await readFile('public/web-app-manifest-512x512.png'), { httpMetadata: { contentType: 'image/png' } });
});
afterAll(() => mf.dispose());
const local = (path: string, init?: RequestInit) => mf.dispatchFetch(`http://localhost${path}`, init);

describe('compiled Pages routes', () => {
  it('routes photo listing and nested keys independently', async () => {
    for (const path of ['/api/photos', '/api/photos/']) {
      const response = await local(path);
      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({ count: 1, date: '2026-09-08', photos: [{ key }] });
    }
    expect(await (await local('/api/photos?recent=4')).json()).toMatchObject({ count: 1, photos: [{ key }], cursor: null });
    const image = await local(`/api/photos/${key}`);
    expect(image.status).toBe(200);
    expect(image.headers.get('Content-Type')).toBe('image/png');
    expect((await image.arrayBuffer()).byteLength).toBeGreaterThan(100);
    const etag = image.headers.get('ETag')!;
    expect((await local(`/api/photos/${key}`, { headers: { 'If-None-Match': etag } })).status).toBe(304);
    const head = await local(`/api/photos/${key}`, { method: 'HEAD' });
    expect(head.status).toBe(200);
    expect(await head.text()).toBe('');
  });
  it('enforces authentication, HTTP methods, JSON errors, and API 404s', async () => {
    expect((await mf.dispatchFetch('https://cabinpi-react.pages.dev/api/photos', {
      headers: { 'cf-access-authenticated-user-email': 'spoof@example.com' },
    })).status).toBe(401);
    expect((await local('/api/photos', { method: 'POST' })).status).toBe(405);
    expect((await local('/api/sensors/ingest')).status).toBe(404);
    expect((await local('/api/unknown')).status).toBe(404);
    expect((await local('/api/photos?date=2026-02-30')).status).toBe(400);
    expect(await (await local('/api/user')).json()).toMatchObject({ authenticated: false });
  });
  it('queries sensors through the middleware and real D1', async () => {
    expect(await (await local('/api/sensors/latest')).json()).toMatchObject({ data: { watts: 100 } });
    const params = new URLSearchParams({ start: '2026-09-08T00:00:00', stop: '2026-09-08T23:59:59' });
    expect(await (await local(`/api/sensors?${params}`)).json()).toMatchObject({ count: 2, data: [{ watts: 100 }, { watts: 0 }] });
    expect(await (await local(`/api/sensors/daily?${params}`)).json()).toMatchObject({ count: 1, data: [{ watts: 100 }] });
    expect((await local('/api/sensors', { method: 'POST' })).status).toBe(405);
  });
});
