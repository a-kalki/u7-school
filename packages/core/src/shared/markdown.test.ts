import { describe, expect, test } from 'bun:test';
import { safeConvert } from './markdown';
import { validateMarkdownV2 } from './markdown-validator';

describe('safeConvert', () => {
  // ── Таблицы ──

  test('таблица преобразуется в список с | разделителем', () => {
    const input = ['| A | B |', '|---|---|', '| 1 | 2 |', '| 3 | 4 |'].join(
      '\n',
    );

    const result = safeConvert(input);
    // convert() экранирует | через escapeSymbols → \|
    expect(result).toContain('• A \\| B');
    expect(result).toContain('• 1 \\| 2');
    expect(result).toContain('• 3 \\| 4');
  });

  test('таблица с форматированием в ячейках', () => {
    const input = [
      '| **Жирный** | `code` |',
      '|----|----|',
      '| текст | `import { x }` |',
    ].join('\n');

    const result = safeConvert(input);
    // convert() обрабатывает **bold** → *bold* и `code` → `code`
    expect(result).toContain('*Жирный*');
    expect(result).toContain('`code`');
    expect(result).toContain('`import { x }`');
  });

  test('таблица внутри кодового блока не преобразуется', () => {
    const input = ['```', '| A | B |', '|---|---|', '| 1 | 2 |', '```'].join(
      '\n',
    );

    const result = safeConvert(input);
    // Внутри ``` таблица остаётся нетронутой
    expect(result).toContain('| A | B |');
    expect(result).toContain('|---|---|');
    expect(result).toContain('| 1 | 2 |');
  });

  // ── Ссылки и _ в URL ──

  test('ссылка [text](url) с _ в URL — не ломается', () => {
    const input =
      '[MDN: Array](https://developer.mozilla.org/ru/docs/Web/JavaScript/Reference/Global_Objects/Array)';

    const result = safeConvert(input);
    // _ внутри URL ссылки — валиден, convert() сохраняет ссылку
    expect(result).toContain('[MDN: Array]');
    expect(result).toContain('Global_Objects');
  });

  // ── Blockquote + ссылка (баг из p4-l4) ──

  test('blockquote со ссылкой — сохраняет > и ссылку', () => {
    const input =
      '> Текст со ссылкой: [MDN: Array](https://example.com/Global_Objects/Array).';

    const result = safeConvert(input);
    // > сохранён (convert выводит как есть, Telegram это принимает)
    expect(result).toContain('>');
    // Ссылка сохранена
    expect(result).toContain('[MDN: Array]');
    // Выход валиден с точки зрения MarkdownV2
    const v = validateMarkdownV2(result);
    expect(v.valid).toBe(true);
  });

  // ── Базовое форматирование ──

  test('**bold** → *bold*', () => {
    expect(safeConvert('**жирный**')).toContain('*жирный*');
  });

  test('`code` сохраняется', () => {
    expect(safeConvert('`код`')).toContain('`код`');
  });

  test('```code block``` сохраняется', () => {
    const result = safeConvert('```\nlet x = 5;\n```');
    expect(result).toContain('let x = 5;');
  });

  // ── Точки и спецсимволы ──

  test('точка экранируется', () => {
    const result = safeConvert('Готово.');
    expect(result).toContain('\\.');
  });

  test('! экранируется', () => {
    const result = safeConvert('Начинаем!');
    expect(result).toContain('\\!');
  });

  // ── Реальный контент (p4-l4 шаг 6) ──

  test('реальный контент с blockquote + ссылкой + кодом', () => {
    const input = [
      'Текст со стрелочными функциями:',
      '',
      '```javascript',
      'let sum = numbers.reduce((acc, item) => acc + item, 0);',
      '```',
      '',
      '> Документация: [MDN: Array](https://developer.mozilla.org/ru/docs/Web/JavaScript/Reference/Global_Objects/Array).',
    ].join('\n');

    const result = safeConvert(input);

    // Кодовый блок не тронут
    expect(result).toContain('(acc, item)');

    // Ссылка сохранена, _ в URL не создаёт проблем
    expect(result).toContain('[MDN: Array]');

    // Валидатор подтверждает: нет проблем с парностью _
    const v = validateMarkdownV2(result);
    expect(v.issues.filter((i) => i.char === '_')).toEqual([]);
  });
});
