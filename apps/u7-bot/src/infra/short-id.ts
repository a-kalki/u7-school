/**
 * Формат сжатого идентификатора (shortId) для callback_data.
 *
 * Сжатый UUID кодируется как `~<hex8>[-<N>]`:
 * - `~` — маркер shortId (тильда не встречается в легитимных сегментах
 *   callback_data: именах контроллеров/стори/действий и UUID);
 * - `<hex8>` — первые 8 символов UUID (hex);
 * - `-<N>` — опциональный суффикс для разрешения коллизий.
 *
 * Распознавание shortId НЕ зависит от суффикса: регекс допускает его
 * опционально, поэтому `~a1b2c3d4` и `~a1b2c3d4-3` распознаются одинаково.
 * Уникальность при коллизиях гарантируется циклом в BotTransport.shrink.
 */

/** Маркер сжатого идентификатора. */
export const SHORT_ID_PREFIX = '~';

/** Регекс shortId: маркер + 8 hex-символов + опциональный суффикс `-<N>`. */
export const SHORT_ID_RE = /^~([0-9a-f]{8})(?:-(\d+))?$/i;

/** Разобранный shortId. */
export interface ShortId {
  /** Первые 8 символов UUID (hex). */
  hexKey: string;
  /** Порядковый номер для разрешения коллизий (undefined — без суффикса). */
  suffix?: number;
}

/** Проверяет, является ли сегмент callback_data сжатым shortId. */
export function isShortId(part: string): boolean {
  return SHORT_ID_RE.test(part);
}

/** Разбирает shortId на hexKey и суффикс. null — если это не shortId. */
export function decodeShortId(part: string): ShortId | null {
  const m = SHORT_ID_RE.exec(part);
  if (!m) return null;
  return {
    hexKey: m[1]!.toLowerCase(),
    suffix: m[2] ? Number(m[2]) : undefined,
  };
}

/** Кодирует hexKey (с опциональным суффиксом) в shortId. */
export function encodeShortId(hexKey: string, suffix?: number): string {
  return suffix === undefined
    ? `${SHORT_ID_PREFIX}${hexKey}`
    : `${SHORT_ID_PREFIX}${hexKey}-${suffix}`;
}
