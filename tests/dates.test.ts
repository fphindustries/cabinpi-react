import { describe, expect, it } from 'vitest';
import { isDateOnly, isSensorTimestamp, formatAsPacificTime, shiftDay } from '../shared/dates';
import { sensorRange, dailyRange, formatChartDate } from '../src/lib/dateUtils';

describe('Pacific wall-clock dates', () => {
  it('validates real calendar dates and timestamps', () => {
    expect(isDateOnly('2024-02-29')).toBe(true);
    expect(isDateOnly('2026-02-29')).toBe(false);
    expect(isSensorTimestamp('2026-09-09T24:00:00')).toBe(false);
    expect(isSensorTimestamp('2026-09-09T12:00:00Z')).toBe(false);
  });
  it('keeps selected days intact across timezones and DST', () => {
    expect(sensorRange('day', '2026-03-08')).toEqual(['2026-03-08T00:00:00', '2026-03-08T23:59:59']);
    expect(dailyRange('2026-11-01', '2026-11-02')).toEqual(['2026-11-01T00:00:00', '2026-11-02T23:59:59']);
    expect(formatAsPacificTime(new Date('2026-09-09T07:00:00Z'))).toBe('2026-09-09T00:00:00');
    expect(formatAsPacificTime(new Date('2026-01-09T08:00:00Z'))).toBe('2026-01-09T00:00:00');
    expect(shiftDay('2026-03-08', -1)).toBe('2026-03-07');
    expect(shiftDay('2026-01-01', -1)).toBe('2025-12-31');
  });
  it('preserves the local 02:30 wall clock even where the browser skips that hour', () => {
    expect(formatChartDate('2026-03-08T02:30:00')).toBe('3/8, 02:30');
    expect(formatChartDate('2026-09-09')).toBe('9/9');
  });
});
