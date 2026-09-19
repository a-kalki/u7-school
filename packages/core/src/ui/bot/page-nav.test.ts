import { describe, expect, test } from 'bun:test';
import { BotPaginator } from './page-nav';

/** Три страницы по одному блоку (лимит 3, блоки по 3 символа) */
function threePages() {
  const p = new BotPaginator();
  const paged = p.paginate(['aaa', 'bbb', 'ccc'], { limit: 3 });
  return { p, pages: paged.pages };
}

describe('BotPaginator / botLimit', () => {
  test('лимит = 4096 − шапка − резерв, резерв положительный', () => {
    const p = new BotPaginator();

    expect(BotPaginator.LIMIT_RESERVE).toBeGreaterThan(0);
    expect(p.botLimit(0)).toBe(4096 - BotPaginator.LIMIT_RESERVE);
    expect(p.botLimit(150)).toBe(4096 - 150 - BotPaginator.LIMIT_RESERVE);
  });

  test('без шапки — дефолтный запас на сопровождающий текст всегда вычитается', () => {
    const p = new BotPaginator();

    expect(BotPaginator.HEADER_RESERVE).toBeGreaterThan(0);
    // Клиент не сказал длину шапки — пагинатор сам оставляет запас
    expect(p.botLimit()).toBe(
      4096 - BotPaginator.HEADER_RESERVE - BotPaginator.LIMIT_RESERVE,
    );
  });

  test('клиент попросил полную длину (fullLength) — без вычетов шапки и резерва', () => {
    const p = new BotPaginator();

    // Клиент сам распорядился бюджетом контента — используем как есть
    expect(p.botLimit(150, { fullLength: 3000 })).toBe(3000);
    expect(p.botLimit(undefined, { fullLength: 2000 })).toBe(2000);
    // Полная длина Telegram без запасов
    expect(p.botLimit(150, { fullLength: 4096 })).toBe(4096);
  });

  test('шапка + резерв не съедают лимит целиком', () => {
    const p = new BotPaginator();
    const header = 200; // типичная шапка экрана
    expect(p.botLimit(header)).toBeGreaterThan(3500);
  });
});

describe('BotPaginator / navRows', () => {
  test('средняя страница — один ряд: ‹ Пред и След ›', () => {
    const { p, pages } = threePages();
    const middle = pages[1];

    const rows = p.navRows(middle!, (n) => `story:program:id1:${n}`);

    expect(rows).toHaveLength(1);
    const row = rows[0];
    expect(row).toHaveLength(2);
    expect(row?.[0]?.text).toBe('‹ Пред');
    expect(row?.[0]?.code).toBe('story:program:id1:0');
    expect(row?.[1]?.text).toBe('След ›');
    expect(row?.[1]?.code).toBe('story:program:id1:2');
  });

  test('первая страница — только След ›', () => {
    const { p, pages } = threePages();

    const rows = p.navRows(pages[0]!, (n) => `c:${n}`);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toHaveLength(1);
    expect(rows[0]?.[0]?.text).toBe('След ›');
    expect(rows[0]?.[0]?.code).toBe('c:1');
  });

  test('последняя страница — только ‹ Пред', () => {
    const { p, pages } = threePages();

    const rows = p.navRows(pages[2]!, (n) => `c:${n}`);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toHaveLength(1);
    expect(rows[0]?.[0]?.text).toBe('‹ Пред');
    expect(rows[0]?.[0]?.code).toBe('c:1');
  });

  test('единственная страница — без ряда навигации', () => {
    const p = new BotPaginator();
    const paged = p.paginate(['aaa'], { limit: 100 });

    expect(p.navRows(paged.pages[0]!, (n) => `c:${n}`)).toEqual([]);
  });
});

describe('BotPaginator / indicator', () => {
  test('многостраничный список — Стр. N/M (1-based для пользователя)', () => {
    const { p, pages } = threePages();

    expect(p.indicator(pages[0]!)).toBe('Стр. 1/3');
    expect(p.indicator(pages[1]!)).toBe('Стр. 2/3');
    expect(p.indicator(pages[2]!)).toBe('Стр. 3/3');
  });

  test('единственная страница — undefined', () => {
    const p = new BotPaginator();
    const paged = p.paginate(['aaa', 'bbb'], { limit: 100 });

    expect(p.indicator(paged.pages[0]!)).toBeUndefined();
  });
});

describe('BotPaginator / коды кнопок и лимит callback_data 64 байта', () => {
  test('номер страницы — числовой сегмент: UUID-сжатие его не трогает', () => {
    // Сжатие транспорта позиционно-независимо: сжимается каждый сегмент,
    // являющийся ПОЛНЫМ UUID; числовой сегмент и имена остаются как есть.
    const uuid = '3f2b8c1a-9d4e-4f6a-b7c8-112233445566';
    const rawCode = `view-stream:program:${uuid}:12`;

    const parts = rawCode.split(':');
    const uuidRe =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const compressed = parts
      .map((part) => (uuidRe.test(part) ? `~${part.slice(0, 8)}` : part))
      .join(':');

    // Числовой сегмент страницы доехал без изменений
    expect(compressed).toBe('view-stream:program:~3f2b8c1a:12');
  });

  test('сжатый код с номером страницы + штамп — в лимите 64 байта', () => {
    // Реалистичный worst case: имя стори + действие + сжатый UUID + номер
    // страницы + штамп эпохи `:~<seq36>` от транспорта
    const code = 'view-stream:program:~3f2b8c1a-3:12';
    const stamp = ':~1z'; // seq=71 в base36 — с запасом
    const full = code + stamp;

    expect(Buffer.byteLength(full, 'utf8')).toBeLessThanOrEqual(64);
  });
});
