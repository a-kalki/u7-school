import { describe, expect, test } from 'bun:test';
import { assertMarkdownV2Safe, validateMarkdownV2 } from './markdown-validator';

describe('validateMarkdownV2 — полный набор резервных символов', () => {
  // ── Символы, которые должны ВСЕГДА быть экранированы (никогда не форматируют) ──

  test('неэкранированная открывающая скобка "(" — ошибка', () => {
    const result = validateMarkdownV2('Прогресс (0%)');
    expect(result.valid).toBe(false);
    const chars = result.issues.map((i) => i.char);
    expect(chars).toContain('(');
  });

  test('неэкранированная закрывающая скобка ")" — ошибка', () => {
    const result = validateMarkdownV2('Прогресс (0%)');
    expect(result.valid).toBe(false);
    const chars = result.issues.map((i) => i.char);
    expect(chars).toContain(')');
  });

  test('неэкранированная "[" — ошибка', () => {
    const result = validateMarkdownV2('Массив [1,2,3]');
    expect(result.valid).toBe(false);
    const chars = result.issues.map((i) => i.char);
    expect(chars).toContain('[');
  });

  test('неэкранированная "]" — ошибка', () => {
    const result = validateMarkdownV2('Массив [1,2,3]');
    expect(result.valid).toBe(false);
    const chars = result.issues.map((i) => i.char);
    expect(chars).toContain(']');
  });

  test('неэкранированный "#" — ошибка', () => {
    const result = validateMarkdownV2('Заголовок #1');
    expect(result.valid).toBe(false);
    const chars = result.issues.map((i) => i.char);
    expect(chars).toContain('#');
  });

  test('неэкранированная "{" — ошибка', () => {
    const result = validateMarkdownV2('Объект { key: value }');
    expect(result.valid).toBe(false);
    const chars = result.issues.map((i) => i.char);
    expect(chars).toContain('{');
  });

  test('неэкранированная "}" — ошибка', () => {
    const result = validateMarkdownV2('Объект { key: value }');
    expect(result.valid).toBe(false);
    const chars = result.issues.map((i) => i.char);
    expect(chars).toContain('}');
  });

  // ── Экранированные символы ошибок НЕ вызывают ──

  test('экранированные скобки "\\( \\)" — OK', () => {
    const result = validateMarkdownV2('Прогресс \\(0\\%\\)');
    expect(result.valid).toBe(true);
  });

  test('экранированные "\\[ \\]" — OK', () => {
    const result = validateMarkdownV2('Массив \\[1,2,3\\]');
    expect(result.valid).toBe(true);
  });

  test('экранированный "\\#" — OK', () => {
    const result = validateMarkdownV2('Заголовок \\#1');
    expect(result.valid).toBe(true);
  });

  test('экранированные "\\{ \\}" — OK', () => {
    const result = validateMarkdownV2('Объект \\{ key: value \\}');
    expect(result.valid).toBe(true);
  });
});

describe('assertMarkdownV2Safe — бросает ошибку на неэкранированные скобки', () => {
  test('assertMarkdownV2Safe бросает ошибку на "("', () => {
    expect(() => assertMarkdownV2Safe('Прогресс (0%)')).toThrow(
      /MarkdownV2 validation failed/,
    );
  });

  test('assertMarkdownV2Safe НЕ бросает ошибку на экранированные скобки', () => {
    expect(() => assertMarkdownV2Safe('Прогресс \\(0\\%\\)')).not.toThrow();
  });
});
