import { describe, expect, test } from 'bun:test';
import { safeConvert } from './markdown';

describe('safeConvert', () => {
  test('экранирует | в таблицах', () => {
    const input = '| A | B |\n|---|---|\n| 1 | 2 |\n';
    const result = safeConvert(input);
    // Ни одного неэкранированного |
    expect(/(?<!\\)\|/.test(result)).toBe(false);
  });

  test('сохраняет | внутри кодовых блоков', () => {
    const input = '```\n| A | B |\n```\n';
    const result = safeConvert(input);
    // | внутри ``` должен остаться без экранирования
    expect(result).toContain('| A | B |');
  });

  test('экранирует = вне кодовых блоков', () => {
    const input = '```js\nlet x = 5;\n```\n\nx = 5';
    const result = safeConvert(input);
    // = внутри кода не экранирован
    expect(result).toContain('let x = 5;');
    // = снаружи экранирован
    expect(result).toContain('\\=');
  });

  test('сохраняет MarkdownV2-форматирование', () => {
    const input = '**жирный** _курсив_';
    const result = safeConvert(input);
    expect(result).toContain('*жирный*');
    expect(result).toContain('_курсив_');
  });

  test('экранирует точку и восклицательный знак', () => {
    const input = 'Готово. Начинаем!';
    const result = safeConvert(input);
    expect(result).toContain('\\.');
    expect(result).toContain('\\!');
  });

  test('не трогает . и ! внутри кодовых блоков', () => {
    const input = '```\nconsole.log("hello!");\n```';
    const result = safeConvert(input);
    expect(result).toContain('hello!');
    expect(/(?<!\\)!/.test(result.split('```')[1]!)).toBe(true);
  });

  test('не переэкранирует уже экранированные символы (negative lookbehind)', () => {
    // convert() уже экранирует скобки и точки в текстовых узлах:
    // «При импорте (`default`).» → «При импорте \(`default`\).»
    // Наш escapeReservedOutsideCode НЕ должен трогать уже экранированные (\(, \), \.)
    const input = 'Функция (`default`).';
    const result = safeConvert(input);
    // После convert(): \(`default`\)\.
    // escapeReservedOutsideCode с (?<!\\) НЕ должен переэкранировать
    // Проверяем что \( и \) не стали \\( \\)
    expect(result).toContain('\\(`default`\\)');
    // И точка экранирована ровно один раз
    expect(result).toMatch(/\\\.$/m);
  });

  test('экранирует { } ( ) [ ] в таблицах и обычном тексте', () => {
    // convert() НЕ экранирует содержимое таблиц
    // { } ( ) [ ] в ячейках таблицы должны быть экранированы
    const input =
      '| Синтаксис | Пример |\n|---|---|\n| `import { x }` | {x} |\n| Массив [1] | (группа) |';
    const result = safeConvert(input);
    // Ни одного неэкранированного { } ( ) [ ]
    expect(/(?<!\\)[{}()[\]]/.test(result)).toBe(false);
  });

  test('не трогает форматирующие символы (* _) от convert()', () => {
    // _ и * имеют форматирующее значение и НЕ входят в набор never-formatting
    const input = '**жирный** и _курсив_ и ~зачёркнутый~';
    const result = safeConvert(input);
    // Форматирование должно сохраниться
    expect(result).toContain('*жирный*');
    expect(result).toContain('_курсив_');
  });

  test('реальный контент с таблицей и кодом — все never-formatting экранированы', () => {
    const input = [
      'У модуля может быть **один** экспорт.',
      '',
      '```js',
      'let x = {a: 1};',
      'console.log(x.a);',
      '```',
      '',
      '| A | B |',
      '|---|---|',
      '| {x} | (y) |',
    ].join('\n');
    const result = safeConvert(input);

    // В кодовом блоке — не экранировано
    expect(result).toContain('let x = {a: 1};');
    expect(result).toContain('console.log(x.a);');

    // Вне кодового блока — все never-formatting экранированы
    const outsideCode = result
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`[^`]+`/g, '');
    expect(/(?<!\\)[-.!+=|>#{}()[\]]/.test(outsideCode)).toBe(false);
  });
});
