import { listPhotos, readPhoto } from '../../../server/photos';
import { json } from '../../../server/http';

export const onRequest: PagesFunction<Env> = async ({ request, env, params }) => {
  const key = Array.isArray(params.key) ? params.key.join('/') : params.key;
  // Pages catch-all routes match both the collection and nested object keys.
  return key ? readPhoto(env.PHOTOS, key, request)
    : json(await listPhotos(env.PHOTOS, new URL(request.url).searchParams));
};
