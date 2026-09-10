import { querySensors } from '../../../server/sensors';
import { json } from '../../../server/http';

export const onRequest: PagesFunction<Env> = async ({ request, env }) =>
  json(await querySensors(env.cabinpi_db, new URL(request.url).searchParams));
