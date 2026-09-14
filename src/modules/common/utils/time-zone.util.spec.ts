import {
  getUtcDayBounds,
  utcToZonedDateTime,
  zonedDateTimeToUtc,
} from './time-zone.util';

describe('time-zone utilities', () => {
  it('converts a Bogota local appointment to UTC', () => {
    const result = zonedDateTimeToUtc('2026-09-21', '10:00', 'America/Bogota');

    expect(result.toISOString()).toBe('2026-09-21T15:00:00.000Z');
  });

  it('uses the daylight-saving offset for Madrid', () => {
    const result = zonedDateTimeToUtc('2026-09-21', '10:00', 'Europe/Madrid');

    expect(result.toISOString()).toBe('2026-09-21T08:00:00.000Z');
    expect(utcToZonedDateTime(result, 'Europe/Madrid')).toMatchObject({
      date: '2026-09-21',
      time: '10:00',
    });
  });

  it('builds UTC bounds for a 23-hour DST day', () => {
    const { startOfDay, endOfDay } = getUtcDayBounds(
      '2026-03-08',
      'America/New_York',
    );

    expect(startOfDay.toISOString()).toBe('2026-03-08T05:00:00.000Z');
    expect(endOfDay.toISOString()).toBe('2026-03-09T03:59:59.999Z');
  });

  it('rejects non-existent local times during the DST jump', () => {
    expect(() =>
      zonedDateTimeToUtc('2026-03-08', '02:30', 'America/New_York'),
    ).toThrow('no existe');
  });

  it('rejects ambiguous local times during the DST fallback', () => {
    expect(() =>
      zonedDateTimeToUtc('2026-11-01', '01:30', 'America/New_York'),
    ).toThrow('es ambigua');
  });
});
