import { latestSensor } from '../../../server/sensors';
import { json } from '../../../server/http';

export const onRequest: PagesFunction<Env> = async ({ env }) =>
  json(await latestSensor(env.cabinpi_db));
