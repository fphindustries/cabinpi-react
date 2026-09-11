import { Hono } from 'hono';
import { authenticate, type RequestData } from '../server/auth';
import { HttpError, json } from '../server/http';
import { latestSensor, querySensors } from '../server/sensors';
import { listPhotos, readPhoto } from '../server/photos';

type Variables = { identity?: RequestData['identity'] };
const app = new Hono<{ Bindings: Env; Variables: Variables }>();

const READ_METHODS = ['GET', 'HEAD'];

app.use('/api/*', async (c, next) => {
  c.set('identity', await authenticate(c.req.raw, c.env));
  if (!READ_METHODS.includes(c.req.method)) {
    return new Response(null, { status: 405, headers: { Allow: READ_METHODS.join(', '), 'Cache-Control': 'no-store' } });
  }
  await next();
  if (c.req.method === 'HEAD') c.res = new Response(null, { status: c.res.status, headers: c.res.headers });
});

app.on(READ_METHODS, '/api/user', c => {
  const email = c.get('identity')?.email;
  if (typeof email !== 'string' || !email) return json({ success: true, authenticated: false });
  return json({ success: true, authenticated: true, user: {
    email, userId: c.get('identity')?.sub ?? null, name: email.split('@')[0],
  } });
});

app.on(READ_METHODS, '/api/sensors/latest', async c => json(await latestSensor(c.env.cabinpi_db)));
app.on(READ_METHODS, '/api/sensors/daily', async c =>
  json(await querySensors(c.env.cabinpi_db, new URL(c.req.url).searchParams, true)));
app.on(READ_METHODS, '/api/sensors', async c =>
  json(await querySensors(c.env.cabinpi_db, new URL(c.req.url).searchParams)));

// A single route covers both the collection and nested object keys, matching
// the prior Pages catch-all behavior for /api/photos and /api/photos/*.
app.on(READ_METHODS, ['/api/photos', '/api/photos/*'], async c => {
  const pathname = new URL(c.req.url).pathname;
  const key = pathname === '/api/photos' ? '' : decodeURIComponent(pathname.slice('/api/photos/'.length));
  return key ? readPhoto(c.env.PHOTOS, key, c.req.raw) : json(await listPhotos(c.env.PHOTOS, new URL(c.req.url).searchParams));
});

app.notFound(() => json({ success: false, error: 'API route not found' }, 404));

app.onError((error, c) => {
  if (error instanceof HttpError) return json({ success: false, error: error.message }, error.status);
  console.error(JSON.stringify({ event: 'api_error', path: new URL(c.req.url).pathname,
    message: error instanceof Error ? error.message : 'Unknown error' }));
  return json({ success: false, error: 'Unable to complete the request' }, 500);
});

export default app;
