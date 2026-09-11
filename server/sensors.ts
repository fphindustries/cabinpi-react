import { sensorFields, type SensorData } from '../shared/sensors';
import { isSensorTimestamp } from '../shared/dates';
import { HttpError } from './http';
import type { LatestSensorResponse, SensorResponse } from '../src/types/api';

const columns = ['date', ...sensorFields, 'inverterOn'] as const;
const selectColumns = columns.join(', ');
const dailyColumns = ['DATE(date) AS date', ...sensorFields.map(field => `MAX(${field}) AS ${field}`), 'MAX(inverterOn) AS inverterOn'].join(', ');
type SensorRow = Omit<SensorData, 'inverterOn'> & { inverterOn: number | null };

function fromRow(row: SensorRow): SensorData {
  return { ...row, inverterOn: row.inverterOn === null ? null : row.inverterOn === 1 };
}

function queryRange(params: URLSearchParams): [string, string] {
  const start = params.get('start');
  const stop = params.get('stop');
  if (!isSensorTimestamp(start) || !isSensorTimestamp(stop) || start > stop) {
    throw new HttpError(400, 'Start and stop must be ordered Pacific timestamps (YYYY-MM-DDTHH:mm:ss)');
  }
  return [start, stop];
}

export async function latestSensor(db: D1Database): Promise<LatestSensorResponse> {
  const row = await db.prepare(`SELECT ${selectColumns} FROM measurements ORDER BY date DESC LIMIT 1`).first<SensorRow>();
  if (!row) throw new HttpError(404, 'No measurements found');
  return { success: true, count: 1, data: fromRow(row) };
}

export async function querySensors(db: D1Database, params: URLSearchParams, daily = false): Promise<SensorResponse> {
  const [start, stop] = queryRange(params);
  const rawLimit = params.get('limit') ?? '1000';
  const limit = Number(rawLimit);
  if (!/^\d+$/.test(rawLimit) || !Number.isInteger(limit) || limit < 1 || limit > 10000) {
    throw new HttpError(400, 'Limit must be an integer from 1 to 10000');
  }
  const sql = daily
    ? `SELECT ${dailyColumns} FROM measurements WHERE date >= ?1 AND date <= ?2 GROUP BY DATE(date) ORDER BY date DESC LIMIT ?3`
    : `SELECT ${selectColumns} FROM measurements WHERE date >= ?1 AND date <= ?2 ORDER BY date DESC LIMIT ?3`;
  const results = await db.prepare(sql).bind(start, stop, limit + 1).all<SensorRow>();
  const data = results.results.slice(0, limit).map(fromRow);
  return { success: true, count: data.length, data, truncated: results.results.length > limit };
}
