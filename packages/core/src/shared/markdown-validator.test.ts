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

// ── Линейный сканер: слепые зоны и код-сущности ──

describe('validateMarkdownV2 — слепая зона \\X (Проблемы 1 и 2)', () => {
  test('\\\\! — литеральный \\ + голой ! — invalid', () => {
    // Старый lookbehind-регекс считал \ перед ! экранированием,
    // хотя он уже потреблён парой \\
    const result = validateMarkdownV2('Готово\\\\!');
    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual({ char: '!', reason: 'unescaped' });
  });

  test('\\\\. — invalid', () => {
    const result = validateMarkdownV2('Точка\\\\.');
    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual({ char: '.', reason: 'unescaped' });
  });

  test('\\\\*bold — незакрытый жирный — invalid (unpaired *)', () => {
    // Старый подсчёт парности съедал \* из \\* — звезда выпадала из счёта
    const result = validateMarkdownV2('\\\\*bold');
    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual({ char: '*', reason: 'unpaired' });
  });

  test('\\! — корректное экранирование — valid', () => {
    expect(validateMarkdownV2('Готово\\!').valid).toBe(true);
  });

  test('\\\\*bold* — формально валидный жирный (\\ + *bold*) — valid', () => {
    // Telegram рендерит это как жирный «\bold» без 400. Смысловой регресс
    // двойного экранирования ловится инвариант-тестами продюсеров
    // (not.toContain(\\\\) в create-stream.test.ts)
    expect(validateMarkdownV2('\\\\*bold*').valid).toBe(true);
  });

  test('голой \\ перед кириллицей — invalid', () => {
    const result = validateMarkdownV2('Путь C:\\темп');
    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual({ char: '\\', reason: 'unescaped' });
  });

  test('\\ в конце текста — invalid', () => {
    const result = validateMarkdownV2('Текст \\');
    expect(result.issues).toContainEqual({ char: '\\', reason: 'unescaped' });
  });
});

describe('validateMarkdownV2 — инлайн-код и пре-блок (Проблемы 3 и 4)', () => {
  test('`code` — valid', () => {
    expect(validateMarkdownV2('Текст `code` далее').valid).toBe(true);
  });

  test('инлайн-код с экранированным бэктиком `a\\`b` — valid (Проблема 4)', () => {
    // Старый регекс `[^`]+` не распознавал это как код
    expect(validateMarkdownV2('Текст `a\\`b` далее').valid).toBe(true);
  });

  test('экранированные символы внутри инлайн-кода, кроме \\` и \\ — invalid', () => {
    const result = validateMarkdownV2('`a\\.b`');
    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual({ char: '\\', reason: 'unescaped' });
  });

  test('точка внутри инлайн-кода без экранирования — valid', () => {
    expect(validateMarkdownV2('`v1.2.3`').valid).toBe(true);
  });

  test('пре-блок с языком и корректным содержимым — valid', () => {
    expect(validateMarkdownV2('```\njs\nconst x = 1;\n```').valid).toBe(true);
  });

  test('голой бэктик внутри пре-блока — invalid', () => {
    const result = validateMarkdownV2('```\nfoo`bar\n```');
    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual({ char: '`', reason: 'unescaped' });
  });

  test('экранированный бэктик внутри пре-блока — valid', () => {
    expect(validateMarkdownV2('```\nfoo\\`bar\n```').valid).toBe(true);
  });

  test('C:\\\\path (экранированный \\) внутри пре-блока — valid', () => {
    expect(validateMarkdownV2('```\nC:\\\\path\n```').valid).toBe(true);
  });

  test('C:\\path (голой \\) внутри пре-блока — invalid — съедает символ', () => {
    // Прод-баг: \n в коде урока рендерился в Telegram как n
    const result = validateMarkdownV2(
      "```\nconsole.log('\\n=== Оклады ===');\n```",
    );
    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual({ char: '\\', reason: 'unescaped' });
  });

  test('незакрытый инлайн-код — invalid', () => {
    const result = validateMarkdownV2('Текст `code далее');
    expect(result.issues).toContainEqual({ char: '`', reason: 'unpaired' });
  });

  test('незакрытый пре-блок — invalid', () => {
    const result = validateMarkdownV2('```\ncode');
    expect(result.issues).toContainEqual({ char: '`', reason: 'unpaired' });
  });
});

describe('validateMarkdownV2 — ссылки и blockquote', () => {
  test('ссылка [t](https://a.b/c) — valid', () => {
    expect(validateMarkdownV2('См [t](https://a.b/c) далее').valid).toBe(true);
  });

  test('зарезервированные символы внутри URL ссылки не считаются ошибкой', () => {
    expect(validateMarkdownV2('[t](https://a.b/c_d-e.f)').valid).toBe(true);
  });

  test('голой [ без (...) — invalid', () => {
    const result = validateMarkdownV2('Массив [1,2] без ссылки');
    expect(result.issues).toContainEqual({ char: '[', reason: 'unescaped' });
  });

  test('> в начале строки (blockquote) — valid', () => {
    expect(validateMarkdownV2('> Цитата\nстрока').valid).toBe(true);
  });

  test('экранированный \\> в середине строки — valid', () => {
    expect(validateMarkdownV2('строка \\> далее').valid).toBe(true);
  });

  test('голой > в середине строки — invalid', () => {
    const result = validateMarkdownV2('строка > далее');
    expect(result.issues).toContainEqual({ char: '>', reason: 'unescaped' });
  });
});
