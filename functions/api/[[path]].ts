import { json } from '../../server/http';

export const onRequest: PagesFunction<Env> = async () =>
  json({ success: false, error: 'API route not found' }, 404);
