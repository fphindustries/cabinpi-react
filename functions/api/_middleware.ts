import { authenticate, type RequestData } from '../../server/auth';
import { HttpError, json } from '../../server/http';

export const onRequest: PagesFunction<Env, string, RequestData> = async context => {
  try {
    context.data.identity = await authenticate(context.request, context.env);
    const allowed = ['GET', 'HEAD'];
    if (!allowed.includes(context.request.method)) {
      return new Response(null, { status: 405, headers: { Allow: allowed.join(', '), 'Cache-Control': 'no-store' } });
    }
    const response = await context.next();
    return context.request.method === 'HEAD'
      ? new Response(null, { status: response.status, headers: response.headers })
      : response;
  } catch (error) {
    if (error instanceof HttpError) return json({ success: false, error: error.message }, error.status);
    console.error(JSON.stringify({ event: 'api_error', path: new URL(context.request.url).pathname,
      message: error instanceof Error ? error.message : 'Unknown error' }));
    return json({ success: false, error: 'Unable to complete the request' }, 500);
  }
};
