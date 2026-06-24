import { convert } from 'markdown-to-telegram';

/**
 * Экранирует спецсимволы MarkdownV2 для Telegram.
 *
 * MarkdownV2 резервирует символы: _ * [ ] ( ) ~ ` > # + - = | { } . !
 * Если они встречаются в plain text, их нужно экранировать обратным слешем.
 *
 * @example
 * escapeMarkdown('Анкета прервана.') // 'Анкета прервана\\.'
 * escapeMarkdown('5 + 5 = 10')      // '5 \\+ 5 \\= 10'
 */
export function escapeMarkdown(text: string): string {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
}

/**
 * Безопасная конвертация Markdown → Telegram MarkdownV2.
 *
 * В отличие от `convert()` из `markdown-to-telegram`, гарантирует,
 * что **все** зарезервированные символы будут экранированы в итоговом тексте.
 *
 * Проблема `convert()`: он корректно обрабатывает разметку (\*\*жирный\*\* и т.д.),
 * но пропускает «никогда не форматирующие» символы (|, =, +, ., !, -) без
 * экранирования — например, внутри таблиц. Telegram API rejects такие сообщения.
 *
 * Алгоритм:
 * 1. `convert(markdown)` — преобразует разметку
 * 2. Пост-экранирование | = + . ! — вне кодовых блоков и инлайн-кода
 */
export function safeConvert(markdown: string): string {
  const converted = convert(markdown);
  return escapeReservedOutsideCode(converted);
}

/**
 * Экранирует «никогда не форматирующие» символы MarkdownV2
 * (| = + . ! -) везде, кроме кодовых блоков (```...```)
 * и инлайн-кода (`...`).
 *
 * Эти символы НИКОГДА не имеют форматирующего значения в MarkdownV2
 * и всегда должны быть экранированы в plain text.
 */
function escapeReservedOutsideCode(text: string): string {
  // Символы, которые никогда не форматируют и должны быть экранированы:
  // | = + . ! -
  const reserved = /[|=+.!-]/g;

  const parts: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    // Ищем кодовый блок (```...```) или инлайн-код (`...`)
    const codeBlock = remaining.match(/^```[\s\S]*?```/);
    const inlineCode = remaining.match(/^`[^`]+`/);

    if (codeBlock) {
      parts.push(codeBlock[0]);
      remaining = remaining.slice(codeBlock[0].length);
    } else if (inlineCode) {
      parts.push(inlineCode[0]);
      remaining = remaining.slice(inlineCode[0].length);
    } else {
      // Обычный текст — до следующего кодового маркера
      const nextMarker = remaining.search(/```|`/);
      if (nextMarker === -1) {
        parts.push(remaining.replace(reserved, '\\$&'));
        remaining = '';
      } else {
        parts.push(remaining.slice(0, nextMarker).replace(reserved, '\\$&'));
        remaining = remaining.slice(nextMarker);
      }
    }
  }

  return parts.join('');
}
