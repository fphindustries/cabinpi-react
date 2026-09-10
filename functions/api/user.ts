import type { RequestData } from '../../server/auth';
import { json } from '../../server/http';

export const onRequest: PagesFunction<Env, string, RequestData> = async ({ data }) => {
  const email = data.identity?.email;
  if (typeof email !== 'string' || !email) return json({ success: true, authenticated: false });
  return json({ success: true, authenticated: true, user: {
    email, userId: data.identity?.sub ?? null, name: email.split('@')[0],
  } });
};
