import { createHash } from 'node:crypto';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Проверяет, является ли строка валидным UUID.
 */
export function isUuid(value: string): boolean {
  return UUID_REGEX.test(value);
}

/**
 * Генерирует детерминированный RFC 4122-совместимый UUID на основе строкового ключа.
 * Если ключ уже является валидным UUID, возвращает его в нижнем регистре.
 */
export function deterministicUuid(key: string): string {
  if (isUuid(key)) {
    return key.toLowerCase();
  }

  const hash = createHash('sha256').update(key).digest();

  // Устанавливаем биты версии 4 (или 5) в байте 6 (0x40..0x4f)
  // и биты варианта RFC 4122 в байте 8 (0x80..0xbf)
  const bytes = new Uint8Array(hash.buffer, hash.byteOffset, 16);
  const b6 = bytes[6] ?? 0;
  const b8 = bytes[8] ?? 0;
  bytes[6] = (b6 & 0x0f) | 0x40; // Version 4
  bytes[8] = (b8 & 0x3f) | 0x80; // Variant RFC 4122

  const hex = Buffer.from(bytes).toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}
