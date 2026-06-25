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
 * Проблема `convert()`: он экранирует символы в текстовых узлах через escapeSymbols(),
 * но НЕ экранирует содержимое таблиц (handleTable берёт plain text через toString()).
 * Кроме того, наше пост-экранирование использует negative lookbehind чтобы
 * не переэкранировать уже экранированные символы (избегаем \\. → \\\\.).
 *
 * Алгоритм:
 * 1. `convert(markdown)` — преобразует разметку
 * 2. Пост-экранирование .!+\-=|>#{}()[] — вне кодовых блоков и инлайн-кода
 */
export function safeConvert(markdown: string): string {
  const converted = convert(markdown);
  return escapeReservedOutsideCode(converted);
}

/**
 * Экранирует «никогда не форматирующие» символы MarkdownV2
 * везде, кроме кодовых блоков (```...```) и инлайн-кода (`...`).
 *
 * MarkdownV2 резервирует две группы символов:
 * 1. Форматирующие: _ * ~ ` — могут иметь смысл разметки
 * 2. Никогда не форматирующие: . ! + - = | > # { } ( ) [ ]
 *
 * Группа 2 ВСЕГДА должна быть экранирована в тексте вне кода.
 * convert() из markdown-to-telegram экранирует их в текстовых узлах,
 * но НЕ в содержимом таблиц. Эта функция добивает пропущенное.
 *
 * Используется negative lookbehind (?<!\\) чтобы не переэкранировать
 * символы, уже экранированные convert() — иначе \. → \\. (два бэкслеша
 * + точка = бэкслеш экранирован, точка нет → ошибка Telegram API).
 */
function escapeReservedOutsideCode(text: string): string {
  // Никогда не форматирующие символы MarkdownV2.
  // (?<!\\) — не экранируем, если уже есть бэкслеш перед символом.
  // - в начале класса — literal, \] — экранированная закрывающая скобка.
  const reserved = /(?<!\\)[-.!+=|>#{}()[\]]/g;

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
