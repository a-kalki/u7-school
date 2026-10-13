/** Миллисекунды для единиц времени */
const MS_IN_SECOND = 1000;
const MS_IN_MINUTE = 60 * MS_IN_SECOND;
const MS_IN_HOUR = 60 * MS_IN_MINUTE;
const MS_IN_DAY = 24 * MS_IN_HOUR;
const MS_IN_WEEK = 7 * MS_IN_DAY;

/**
 * Регулярное выражение для парсинга относительного времени:
 * T, T+2d, T-2д, T-30m, T-2h, etc.
 */
const RELATIVE_TIME_REGEX = /^T\s*([+-])?\s*(\d+)?\s*([a-zа-яё]+)?$/i;

/**
 * Преобразует относительное время или возвращает абсолютную строку без изменений.
 *
 * @param expr Относительное выражение ('T-2d', 'T-2д', 'T', 'T+5д') или абсолютная дата
 * @param anchorDate Опорная дата мира T
 * @returns ISO-строка даты
 */
export function resolveRelativeTime(
  expr: string,
  anchorDate: Date = new Date(),
): string {
  const trimmed = expr.trim();

  // Если это чисто 'T'
  if (trimmed === 'T') {
    return anchorDate.toISOString();
  }

  const match = trimmed.match(RELATIVE_TIME_REGEX);
  if (match) {
    const signStr = match[1];
    const amountStr = match[2];
    const unitStr = match[3]?.toLowerCase();

    if (!signStr || !amountStr) {
      return anchorDate.toISOString();
    }

    const sign = signStr === '-' ? -1 : 1;
    const amount = Number.parseInt(amountStr, 10);
    let unitMs = MS_IN_DAY;

    if (unitStr) {
      if (
        unitStr === 'd' ||
        unitStr === 'д' ||
        unitStr.startsWith('day') ||
        unitStr.startsWith('дн')
      ) {
        unitMs = MS_IN_DAY;
      } else if (
        unitStr === 'w' ||
        unitStr === 'нед' ||
        unitStr.startsWith('week')
      ) {
        unitMs = MS_IN_WEEK;
      } else if (
        unitStr === 'h' ||
        unitStr === 'ч' ||
        unitStr.startsWith('hour')
      ) {
        unitMs = MS_IN_HOUR;
      } else if (
        unitStr === 'm' ||
        unitStr === 'м' ||
        unitStr.startsWith('min')
      ) {
        unitMs = MS_IN_MINUTE;
      } else if (
        unitStr === 's' ||
        unitStr === 'с' ||
        unitStr.startsWith('sec')
      ) {
        unitMs = MS_IN_SECOND;
      }
    }

    const targetTimestamp = anchorDate.getTime() + sign * amount * unitMs;
    return new Date(targetTimestamp).toISOString();
  }

  // Если это не относительное выражение, возвращаем как есть (абсолютная дата)
  return trimmed;
}

/**
 * Форматирует дату в формат ISO минут (YYYY-MM-DDTHH:mm), принятый в домене peer-review.
 */
export function isoMinute(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().slice(0, 16);
}
