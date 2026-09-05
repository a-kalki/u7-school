import { convert } from 'markdown-to-telegram';

// ── MdText — безопасный MarkdownV2 ──

/**
 * Брендированный тип «безопасного» MarkdownV2-текста для Telegram.
 *
 * Производится ТОЛЬКО хелперами `md`/`mdRaw`: доменные данные вставляются
 * через `${}`-интерполяцию `md` и экранируются автоматически. Присвоить
 * обычную строку в поля `Screen.text` и `NotificationPayload.text`
 * компилятор не даст — забывание экранирования невозможно типами.
 */
export type MdText = string & { readonly __md: never };

/**
 * Тегированный шаблон безопасного MarkdownV2.
 *
 * Литеральные части проходят как есть (разметка разрешена и остаётся
 * на совести автора текста), интерполированные `${значения}` экранируются
 * целиком — доменные данные не могут сломать разметку.
 *
 * @example
 * const name = 'Иван_5';
 * md`Привет, *${name}*!` // 'Привет, *Иван\\_5*!'
 */
export function md(
  strings: TemplateStringsArray,
  ...values: unknown[]
): MdText {
  let result = '';
  for (let i = 0; i < strings.length; i++) {
    result += strings[i];
    if (i < values.length) {
      result += escapeMarkdown(String(values[i]));
    }
  }
  return result as MdText;
}

/**
 * Явный «этот текст уже корректный MarkdownV2» (редкие случаи: вставка
 * заранее размеченного блока). Ответственность за экранирование — на
 * вызывающем.
 */
export function mdRaw(text: string): MdText {
  return text as MdText;
}

/**
 * Конкатенация MdText-фрагментов — композиция разметки.
 *
 * Бренд MdText существует только в типах, поэтому `md`-интерполяция не может
 * отличить «уже безопасный» фрагмент и экранирует его повторно. Склейку
 * готовых MdText делайте здесь — без повторного экранирования.
 */
export function mdConcat(...parts: MdText[]): MdText {
  return parts.join('') as MdText;
}

/** Склейка MdText-строк с разделителем (по умолчанию \n) — композиция. */
export function mdJoin(parts: MdText[], separator = '\n'): MdText {
  return parts.join(separator) as MdText;
}

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
 * Проблема `convert()` из `markdown-to-telegram`: он НЕ экранирует
 * содержимое таблиц (handleTable берёт plain text через toString(),
 * таблицы официально unsupported).
 *
 * Решение: предобработка Markdown перед `convert()`.
 * `prepareMarkdown()` приводит неподдерживаемые элементы (таблицы)
 * к формату, который `convert()` умеет обрабатывать.
 * Никакой пост-обработки — `convert()` делает всё остальное.
 *
 * Алгоритм:
 * 1. `prepareMarkdown(markdown)` — приводит таблицы к текстовому виду
 * 2. `convert(prepared)` — преобразует разметку, экранирует символы
 */
export function safeConvert(markdown: string): string {
  return convert(prepareMarkdown(markdown));
}

// ═══════════════════════════════════════════════════════════════
// Предобработка Markdown
// ═══════════════════════════════════════════════════════════════

/** Функция-предобработчик Markdown перед передачей в convert() */
type MarkdownPreprocessor = (markdown: string) => string;

/**
 * Точка расширения для предобработки Markdown.
 *
 * Каждый обработчик в pipeline приводит неподдерживаемый `convert()`
 * элемент Markdown к виду, который `convert()` сможет обработать
 * без потери смысла и без нарушения экранирования.
 *
 * При обнаружении новой проблемы — добавляем обработчик в массив.
 */
function prepareMarkdown(markdown: string): string {
  const preprocessors: MarkdownPreprocessor[] = [fixTables];
  return preprocessors.reduce((md, fn) => fn(md), markdown);
}

// ═══════════════════════════════════════════════════════════════
// Обработчики
// ═══════════════════════════════════════════════════════════════

/**
 * Преобразует Markdown-таблицы в маркированный список.
 *
 * `convert()` не умеет экранировать содержимое ячеек таблиц
 * (handleTable выводит plain text из toString() без escapeSymbols).
 *
 * Этот обработчик заменяет таблицу на плоский текст:
 * ```
 * | A | B |             • A | B
 * |---|---|      →      • 1 | 2
 * | 1 | 2 |
 * | 3 | 4 |
 * ```
 *
 * Ячейки разделяются `|` — `convert()` экранирует его через escapeSymbols()
 * в текстовых узлах, в Telegram отобразится как `|`.
 *
 * Форматирование внутри ячеек (`` `code` ``, `**bold**`) сохраняется
 * и будет обработано `convert()`.
 *
 * Добавляет дополнительный `\n` после таблицы, чтобы следующий абзац
 * не «прилипал»: оригинальная таблица поглощает один из двух `\n\n`.
 */
function fixTables(markdown: string): string {
  return outsideCodeBlocks(markdown, convertTablesInText);
}

/** Применяет transform к тексту вне кодовых блоков (```...```) */
function outsideCodeBlocks(
  markdown: string,
  transform: (text: string) => string,
): string {
  const parts: string[] = [];
  let remaining = markdown;

  while (remaining.length > 0) {
    const codeBlock = remaining.match(/^```[\s\S]*?```/);
    if (codeBlock) {
      parts.push(codeBlock[0]);
      remaining = remaining.slice(codeBlock[0].length);
      continue;
    }

    const nextCode = remaining.search(/```/);
    const segment = nextCode === -1 ? remaining : remaining.slice(0, nextCode);

    parts.push(transform(segment));
    remaining = nextCode === -1 ? '' : remaining.slice(nextCode);
  }

  return parts.join('');
}

/** Находит и преобразует таблицы в текстовом сегменте (вне кодовых блоков) */
function convertTablesInText(text: string): string {
  // Строка заголовка | разделитель |---| | строки данных
  const tableRe = /^\|.+\|\n\|[-:| ]+\|\n(?:\|.+\|\n?)+/gm;

  return text.replace(tableRe, (table) => {
    const lines = table.trim().split('\n');
    const [header, , ...dataRows] = lines;

    const formatRow = (row: string): string => {
      // Ячейки разделены |, первая и последняя пустые (от split)
      const cells = row
        .split('|')
        .filter((c) => c !== '')
        .map((c) => c.trim());
      return `• ${cells.join(' | ')}`;
    };

    if (!header) return '';

    // + '\n' в конце — компенсирует поглощённый таблицей \n,
    // чтобы следующий абзац не прилипал
    return `${[formatRow(header), ...dataRows.map(formatRow)].join('\n')}\n`;
  });
}
