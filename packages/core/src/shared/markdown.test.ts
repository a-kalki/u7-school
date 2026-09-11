import { describe, expect, test } from 'bun:test';
import {
  escapeMarkdown,
  type MdText,
  md,
  mdCodeBlock,
  mdConcat,
  mdInlineCode,
  mdJoin,
  mdRaw,
  safeConvert,
} from './markdown';
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

// ── mdCodeBlock / mdInlineCode — безопасные код-сущности ──

describe('mdCodeBlock — пре-блок по правилам Telegram', () => {
  test('экранирует бэктик и обратный слеш, обёрнуто в ```-блок', () => {
    // biome-ignore lint/suspicious/noTemplateCurlyInString: ${y} — код урока с шаблонной строкой, проверяем как есть
    const result = mdCodeBlock('const s = `x\\n${y}`;');

    // biome-ignore lint/suspicious/noTemplateCurlyInString: ожидание содержит ${y} из кода урока
    expect(String(result)).toBe('```\nconst s = \\`x\\\\n${y}\\`;\n```');
  });

  test('прод-кейс: \\n в коде урока не съедается Telegram', () => {
    // ИЗ steps.json (шаг 0f9136e0): console.log('\n=== Оклады ===');
    // Голый \ внутри pre съедал 'n' → в Telegram приходило 'n=== Оклады ==='
    const result = String(mdCodeBlock("console.log('\\n=== Оклады ===');"));

    expect(result).toContain("console.log('\\\\n=== Оклады ===');");
  });

  test('результат проходит валидатор', () => {
    const result = mdCodeBlock('const path = `C:\\dir\\x`; const t = `a\\`b`;');

    expect(validateMarkdownV2(result).valid).toBe(true);
  });
});

describe('mdInlineCode — инлайн-код по правилам Telegram', () => {
  test('экранирует бэктик и обратный слеш', () => {
    expect(String(mdInlineCode('a ` b \\ c'))).toBe('`a \\` b \\\\ c`');
  });

  test('результат проходит валидатор', () => {
    expect(validateMarkdownV2(mdInlineCode('x\\ny`z')).valid).toBe(true);
  });
});

describe('escapeMarkdown — обратный слеш', () => {
  test('экранирует \\ в plain-данных — Telegram не съедает следующий символ', () => {
    expect(String(md`Путь: ${'C:\\temp'}`)).toBe('Путь: C:\\\\temp');
  });
});

// ── md / mdRaw / MdText — безопасный конструктор MarkdownV2 ──

describe('md — тегированный шаблон', () => {
  test('интерполяция экранирует доменные данные', () => {
    const userName = 'Иван_5 + 5 = 10.';
    const text = md`Привет, ${userName}!`;

    expect(String(text)).toBe('Привет, Иван\\_5 \\+ 5 \\= 10\\.!');
  });

  test('литеральные части не экранируются — разметка сохраняется', () => {
    const text = md`*Жирный* и ${'точка.'}`;

    // Разметка литерала жива, данные экранированы
    expect(String(text)).toBe('*Жирный* и точка\\.');
  });

  test('несколько интерполяций подряд', () => {
    const text = md`${'a_b'} и ${'c(d)'} и ${'e.f'}`;

    expect(String(text)).toBe('a\\_b и c\\(d\\) и e\\.f');
  });

  test('не-строковые значения приводятся к строке', () => {
    const text = md`Количество: ${42}, флаг: ${null}`;

    expect(String(text)).toBe('Количество: 42, флаг: null');
  });

  test('результат проходит валидатор MarkdownV2 при опасных данных', () => {
    const text = md`Ответ: ${'5 + 5 = 10. Отлично_1!'}`;

    expect(validateMarkdownV2(text).valid).toBe(true);
  });

  test('результат — строка (бренд-тип стирается в рантайме)', () => {
    const text: MdText = md`Текст`;

    expect(typeof text).toBe('string');
    expect(String(text)).toBe('Текст');
  });
});

describe('mdRaw — явный «уже с разметкой»', () => {
  test('пропускает текст как есть, без экранирования', () => {
    const raw = '*Жирный* и `код` и [ссылка](https://example.com)\\.';

    expect(String(mdRaw(raw))).toBe(raw);
  });

  test('валидный размеченный текст проходит валидатор', () => {
    const text = mdRaw('*Заголовок*\\. Точка экранирована\\.');

    expect(validateMarkdownV2(text).valid).toBe(true);
  });
});

// ── Композиция: mdConcat / mdJoin ──

describe('mdConcat / mdJoin — композиция MdText', () => {
  test('mdConcat склеивает без повторного экранирования', () => {
    const part1 = md`Курс: *${'Java_5'}*`;
    const part2 = md`\nСтатус: ${'запись (открыта)'}`;

    const result = mdConcat(part1, part2);

    expect(String(result)).toBe(
      'Курс: *Java\\_5*\nСтатус: запись \\(открыта\\)',
    );
  });

  test('mdJoin склеивает списком с разделителем', () => {
    const lines = [md`• ${'Первая'}`, md`• ${'Вторая_2'}`];

    const result = mdJoin(lines, '\n');

    expect(String(result)).toBe('• Первая\n• Вторая\\_2');
  });

  test('интерполяция MdText в md экранирует повторно — потому нужна композиция', () => {
    const part = md`*${'bold_имя'}*`; // уже безопасный фрагмент

    const wrong = md`Заголовок\n${part}`;
    const right = mdConcat(md`Заголовок\n`, part);

    // wrong: разметка part экранирована повторно (звёзды, подчёрки и слеши удвоены)
    expect(String(wrong)).toBe(`Заголовок\n${escapeMarkdown(String(part))}`);
    // right: композиция сохраняет разметку, экранирование одинарное
    expect(String(right)).toBe('Заголовок\n*bold\\_имя*');
  });
});
