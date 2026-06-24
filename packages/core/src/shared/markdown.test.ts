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
});
