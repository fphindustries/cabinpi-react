import { formatAsPacificTime, isDateOnly, pacificToday } from '../../shared/dates';
export { pacificToday, shiftDay, isDateOnly } from '../../shared/dates';

export type TimeRangeType = '1h' | '6h' | '24h' | '7d' | 'day';
export function timeRangeParam(value: string | null): TimeRangeType {
  return value && ['1h', '6h', '24h', '7d', 'day'].includes(value) ? value as TimeRangeType : '24h';
}

export function dateParam(value: string | null): string | null {
  return value && isDateOnly(value) ? value : null;
}

/** Calendar selections are already Pacific dates; only instants need conversion. */
export function sensorRange(range: TimeRangeType, date: string | null, now = new Date()): [string, string] {
  if (range === 'day') {
    const day = date && isDateOnly(date) ? date : pacificToday(now);
    return [`${day}T00:00:00`, `${day}T23:59:59`];
  }
  const hours = { '1h': 1, '6h': 6, '24h': 24, '7d': 168 }[range];
  return [formatAsPacificTime(new Date(now.getTime() - hours * 3600000)), formatAsPacificTime(now)];
}

export function dailyRange(start: string | null, stop: string | null, now = new Date()): [string, string] {
  const first = start ?? formatAsPacificTime(new Date(now.getTime() - 29 * 86400000)).slice(0, 10);
  const last = stop ?? pacificToday(now);
  return [`${first}T00:00:00`, `${last}T23:59:59`];
}

/** Display Pacific wall-clock strings without browser timezone or DST reinterpretation. */
export function formatChartDate(value: string): string {
  const [date, time] = value.replace(' ', 'T').split('T');
  const [, month, day] = date.split('-');
  return `${Number(month)}/${Number(day)}${time ? `, ${time.slice(0, 5)}` : ''}`;
}
