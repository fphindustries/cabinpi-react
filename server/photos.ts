import type { Photo, PhotoResponse } from '../src/types/api';
import { isDateOnly, isSensorTimestamp } from '../shared/dates';
import { HttpError } from './http';

const PAGE_SIZE = 100;
const RECENT_PHOTO_LIMIT = 4;
const THUMBNAIL_WIDTH = 480;
const THUMBNAIL_QUALITY = 75;
const THUMBNAIL_CACHE_CONTROL = 'private, max-age=86400';
const imageTypes: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', avif: 'image/avif',
};

export function photoFromKey(key: string): Photo | null {
  const match = /^(\d{4})\/(\d{2})\/(\d{2})\/([^/\\]+)-(\d{4}-\d{2}-\d{2})-(\d{2})-(\d{2})(?:-(\d{2}))?\.(jpg|jpeg|png|webp|avif)$/i.exec(key);
  if (!match) return null;
  const [, year, month, day, camera, date, hour, minute, second = '00'] = match;
  const timestamp = `${date}T${hour}:${minute}:${second}`;
  if (date !== `${year}-${month}-${day}` || !isSensorTimestamp(timestamp)) return null;
  const path = `/api/photos/${key.split('/').map(encodeURIComponent).join('/')}`;
  return {
    key, filename: key.slice(key.lastIndexOf('/') + 1), camera: camera.replaceAll('_', ' '), timestamp,
    url: path, thumbnailUrl: `${path}?thumbnail=1`,
  };
}

export function photoContentType(key: string): string {
  return imageTypes[key.split('.').pop()!.toLowerCase()];
}

function hasBody(object: R2Object): object is R2ObjectBody {
  return 'body' in object;
}

async function folders(bucket: R2Bucket, prefix: string, pattern: RegExp): Promise<string[]> {
  const values: string[] = [];
  let cursor: string | undefined;
  do {
    const page = await bucket.list({ prefix, delimiter: '/', limit: 1000, cursor });
    values.push(...page.delimitedPrefixes.filter(value => pattern.test(value)));
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
  return values.sort().reverse();
}

/** Descend through date folders, listing prefixes rather than every photo in the archive. */
async function latestDate(bucket: R2Bucket): Promise<string | null> {
  for (const year of await folders(bucket, '', /^\d{4}\/$/)) {
    for (const month of await folders(bucket, year, /^\d{4}\/(?:0[1-9]|1[0-2])\/$/)) {
      for (const day of await folders(bucket, month, /^\d{4}\/\d{2}\/\d{2}\/$/)) {
        const date = day.slice(0, -1).replaceAll('/', '-');
        if (!isDateOnly(date)) continue;
        let cursor: string | undefined;
        do {
          const page = await bucket.list({ prefix: day, limit: PAGE_SIZE, cursor });
          if (page.objects.some(object => photoFromKey(object.key))) return date;
          cursor = page.truncated ? page.cursor : undefined;
        } while (cursor);
      }
    }
  }
  return null;
}

async function photosForDate(bucket: R2Bucket, date: string): Promise<Photo[]> {
  const photos: Photo[] = [];
  let cursor: string | undefined;
  do {
    const page = await bucket.list({ prefix: `${date.replaceAll('-', '/')}/`, limit: PAGE_SIZE, cursor });
    photos.push(...page.objects.map(object => photoFromKey(object.key)).filter((photo): photo is Photo => photo !== null));
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
  return photos;
}

/** Return the newest captures across date folders, regardless of camera-key ordering. */
async function listRecentPhotos(bucket: R2Bucket): Promise<PhotoResponse> {
  const photos: Photo[] = [];
  for (const year of await folders(bucket, '', /^\d{4}\/$/)) {
    for (const month of await folders(bucket, year, /^\d{4}\/(?:0[1-9]|1[0-2])\/$/)) {
      for (const day of await folders(bucket, month, /^\d{4}\/\d{2}\/\d{2}\/$/)) {
        const date = day.slice(0, -1).replaceAll('/', '-');
        if (!isDateOnly(date)) continue;
        photos.push(...await photosForDate(bucket, date));
        if (photos.length >= RECENT_PHOTO_LIMIT) {
          const recent = photos.sort((left, right) => right.timestamp.localeCompare(left.timestamp) || left.camera.localeCompare(right.camera))
            .slice(0, RECENT_PHOTO_LIMIT);
          return { success: true, count: recent.length, date: recent[0]?.timestamp.slice(0, 10) ?? null, photos: recent, cursor: null };
        }
      }
    }
  }
  const recent = photos.sort((left, right) => right.timestamp.localeCompare(left.timestamp) || left.camera.localeCompare(right.camera));
  return { success: true, count: recent.length, date: recent[0]?.timestamp.slice(0, 10) ?? null, photos: recent, cursor: null };
}

export async function listPhotos(bucket: R2Bucket, params: URLSearchParams): Promise<PhotoResponse> {
  const recent = params.get('recent');
  if (recent !== null) {
    if (recent !== String(RECENT_PHOTO_LIMIT) || params.size !== 1) {
      throw new HttpError(400, `Recent photos must request exactly ${RECENT_PHOTO_LIMIT} items`);
    }
    return listRecentPhotos(bucket);
  }
  const requestedDate = params.get('date');
  const cursor = params.get('cursor') || undefined;
  if (requestedDate !== null && !isDateOnly(requestedDate)) throw new HttpError(400, 'Date must be YYYY-MM-DD');
  if (cursor && (!requestedDate || cursor.length > 4096)) throw new HttpError(400, 'A photo cursor requires a valid date');
  const date = requestedDate ?? await latestDate(bucket);
  if (!date) return { success: true, count: 0, date: null, photos: [], cursor: null };
  let page: R2Objects;
  try {
    page = await bucket.list({ prefix: `${date.replaceAll('-', '/')}/`, limit: PAGE_SIZE, cursor });
  } catch (error) {
    // R2 rejects malformed opaque cursors; preserve unexpected storage failures as 500s.
    if (cursor && error instanceof Error && /cursor/i.test(error.message)) throw new HttpError(400, 'Invalid photo cursor');
    throw error;
  }
  const photos = page.objects.map(object => photoFromKey(object.key)).filter((photo): photo is Photo => photo !== null);
  return { success: true, count: photos.length, date, photos, cursor: page.truncated ? page.cursor : null };
}

export async function readPhoto(bucket: R2Bucket, key: string, request: Request): Promise<Response> {
  if (!photoFromKey(key)) throw new HttpError(404, 'Photo not found');
  // Only support cache validation; do not interpret arbitrary preconditions as a 304.
  const condition = new Headers();
  const etag = request.headers.get('If-None-Match');
  if (etag) condition.set('If-None-Match', etag);
  const object = request.method === 'HEAD'
    ? await bucket.head(key)
    : await bucket.get(key, { onlyIf: condition });
  if (!object) throw new HttpError(404, 'Photo not found');
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('Content-Type', photoContentType(key));
  headers.set('ETag', object.httpEtag);
  headers.set('Cache-Control', 'private, max-age=3600, must-revalidate');
  headers.set('X-Content-Type-Options', 'nosniff');
  const headNotModified = request.method === 'HEAD' && etag?.split(',').some(value =>
    value.trim() === '*' || value.trim().replace(/^W\//, '') === object.httpEtag);
  if (headNotModified || (request.method !== 'HEAD' && !hasBody(object))) return new Response(null, { status: 304, headers });
  headers.set('Content-Length', String(object.size));
  return new Response(hasBody(object) ? object.body : null, { headers });
}

export async function readPhotoThumbnail(bucket: R2Bucket, images: ImagesBinding, key: string, request: Request): Promise<Response> {
  if (!photoFromKey(key)) throw new HttpError(404, 'Photo not found');
  if (request.method === 'HEAD') {
    if (!await bucket.head(key)) throw new HttpError(404, 'Photo not found');
    return new Response(null, { headers: {
      'Content-Type': 'image/jpeg', 'Cache-Control': THUMBNAIL_CACHE_CONTROL, 'X-Content-Type-Options': 'nosniff',
    } });
  }
  const object = await bucket.get(key);
  if (!object) throw new HttpError(404, 'Photo not found');
  const result = await images.input(object.body)
    .transform({ width: THUMBNAIL_WIDTH })
    .output({ format: 'image/jpeg', quality: THUMBNAIL_QUALITY });
  return result.response({ headers: { 'Cache-Control': THUMBNAIL_CACHE_CONTROL, 'X-Content-Type-Options': 'nosniff' } });
}
