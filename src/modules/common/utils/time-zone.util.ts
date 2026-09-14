export interface ZonedDateTimeParts {
  date: string;
  time: string;
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const formatterCache = new Map<string, Intl.DateTimeFormat>();

function getFormatter(timeZone: string): Intl.DateTimeFormat {
  let formatter = formatterCache.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-US-u-ca-gregory-nu-latn', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    });
    formatterCache.set(timeZone, formatter);
  }

  return formatter;
}

function getNumericParts(
  value: Date,
  timeZone: string,
): Omit<ZonedDateTimeParts, 'date' | 'time'> {
  const parts = getFormatter(timeZone).formatToParts(value);
  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, Number(part.value)]),
  );

  return {
    year: values.year,
    month: values.month,
    day: values.day,
    hour: values.hour,
    minute: values.minute,
    second: values.second,
  };
}

function parseDate(date: string): { year: number; month: number; day: number } {
  if (!DATE_PATTERN.test(date)) {
    throw new RangeError('La fecha debe tener formato YYYY-MM-DD');
  }

  const [year, month, day] = date.split('-').map(Number);
  const validationDate = new Date(Date.UTC(year, month - 1, day));
  if (
    validationDate.getUTCFullYear() !== year ||
    validationDate.getUTCMonth() !== month - 1 ||
    validationDate.getUTCDate() !== day
  ) {
    throw new RangeError('Fecha local invalida');
  }

  return { year, month, day };
}

function parseTime(time: string): { hour: number; minute: number } {
  if (!TIME_PATTERN.test(time)) {
    throw new RangeError('La hora debe tener formato HH:mm');
  }

  const [hour, minute] = time.split(':').map(Number);
  return { hour, minute };
}

function getOffsetMilliseconds(value: Date, timeZone: string): number {
  const parts = getNumericParts(value, timeZone);
  const valueWithoutMilliseconds = Math.floor(value.getTime() / 1000) * 1000;
  return (
    Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
    ) - valueWithoutMilliseconds
  );
}

function partsMatch(
  actual: Omit<ZonedDateTimeParts, 'date' | 'time'>,
  expected: {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
  },
): boolean {
  return (
    actual.year === expected.year &&
    actual.month === expected.month &&
    actual.day === expected.day &&
    actual.hour === expected.hour &&
    actual.minute === expected.minute &&
    actual.second === 0
  );
}

export function canonicalizeIanaTimeZone(timeZone: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', { timeZone }).resolvedOptions()
      .timeZone;
  } catch {
    throw new RangeError(`Zona horaria IANA invalida: ${timeZone}`);
  }
}

export function isValidIanaTimeZone(timeZone: unknown): timeZone is string {
  if (typeof timeZone !== 'string' || !timeZone.trim()) {
    return false;
  }

  try {
    canonicalizeIanaTimeZone(timeZone);
    return true;
  } catch {
    return false;
  }
}

/**
 * Converts a wall-clock date and time in an IANA zone to its UTC instant.
 * Non-existent and ambiguous wall-clock times around DST transitions are rejected
 * because they do not identify exactly one instant.
 */
export function zonedDateTimeToUtc(
  date: string,
  time: string,
  timeZone: string,
): Date {
  const canonicalTimeZone = canonicalizeIanaTimeZone(timeZone);
  const expected = { ...parseDate(date), ...parseTime(time) };
  const wallClockAsUtc = Date.UTC(
    expected.year,
    expected.month - 1,
    expected.day,
    expected.hour,
    expected.minute,
    0,
    0,
  );

  // Sampling around the requested wall time finds every offset involved in a
  // nearby DST transition without depending on the operating system time zone.
  const offsets = new Set<number>();
  for (let hours = -48; hours <= 48; hours += 6) {
    offsets.add(
      getOffsetMilliseconds(
        new Date(wallClockAsUtc + hours * 60 * 60 * 1000),
        canonicalTimeZone,
      ),
    );
  }

  const candidates = Array.from(offsets)
    .map((offset) => new Date(wallClockAsUtc - offset))
    .filter((candidate) =>
      partsMatch(getNumericParts(candidate, canonicalTimeZone), expected),
    )
    .sort((left, right) => left.getTime() - right.getTime());

  if (candidates.length === 0) {
    throw new RangeError(
      `La fecha/hora ${date} ${time} no existe en ${canonicalTimeZone}`,
    );
  }
  if (candidates.length > 1) {
    throw new RangeError(
      `La fecha/hora ${date} ${time} es ambigua en ${canonicalTimeZone}`,
    );
  }

  return candidates[0];
}

export function utcToZonedDateTime(
  value: Date,
  timeZone: string,
): ZonedDateTimeParts {
  const canonicalTimeZone = canonicalizeIanaTimeZone(timeZone);
  const parts = getNumericParts(new Date(value), canonicalTimeZone);
  const date = `${String(parts.year).padStart(4, '0')}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
  const time = `${String(parts.hour).padStart(2, '0')}:${String(parts.minute).padStart(2, '0')}`;

  return { date, time, ...parts };
}

export function addDaysToLocalDate(date: string, days: number): string {
  const { year, month, day } = parseDate(date);
  const result = new Date(Date.UTC(year, month - 1, day + days));
  return `${String(result.getUTCFullYear()).padStart(4, '0')}-${String(result.getUTCMonth() + 1).padStart(2, '0')}-${String(result.getUTCDate()).padStart(2, '0')}`;
}

export function getUtcDayBounds(
  date: string,
  timeZone: string,
): { startOfDay: Date; endOfDay: Date } {
  const startOfDay = zonedDateTimeToUtc(date, '00:00', timeZone);
  const nextDay = zonedDateTimeToUtc(
    addDaysToLocalDate(date, 1),
    '00:00',
    timeZone,
  );
  return {
    startOfDay,
    endOfDay: new Date(nextDay.getTime() - 1),
  };
}

export function getLocalDayOfWeek(date: string): number {
  const { year, month, day } = parseDate(date);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}
