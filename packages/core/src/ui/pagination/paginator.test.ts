import { describe, expect, test } from 'bun:test';
import { type Paged, Paginator } from './paginator';

/** Собирает тексты всех страниц — проверка целостности блоков */
function pageTexts(paged: Paged): string[] {
  return paged.pages.map((p) => p.text);
}

describe('Paginator / базовое разбиение', () => {
  test('короткий список — одна страница, isSingle, без соседей', () => {
    const p = new Paginator();
    const paged = p.paginate(['aaa', 'bbb', 'ccc'], { limit: 100 });

    expect(paged.isEmpty).toBe(false);
    expect(paged.isSingle).toBe(true);
    expect(paged.pages).toHaveLength(1);

    const page = paged.pages[0];
    expect(page?.index).toBe(0);
    expect(page?.total).toBe(1);
    expect(page?.hasPrev).toBe(false);
    expect(page?.hasNext).toBe(false);
    expect(page?.prevStart).toBeNull();
    expect(page?.nextStart).toBeNull();
    expect(page?.text).toBe('aaa\nbbb\nccc');
    expect(page?.items).toEqual(['aaa', 'bbb', 'ccc']);
    expect(page?.oversized).toBe(false);
  });

  test('малый лимит — страницы из целых блоков, порядок сохранён', () => {
    const p = new Paginator();
    // лимит 10: страница вмещает 2 блока по 4 символа + '\n' (4+1+4=9)
    const paged = p.paginate(['aaaa', 'bbbb', 'cccc', 'dddd', 'eeee'], {
      limit: 10,
    });

    expect(paged.isSingle).toBe(false);
    expect(paged.pages).toHaveLength(3);
    // Каждый блок целиком на одной странице, порядок не нарушен
    expect(pageTexts(paged)).toEqual(['aaaa\nbbbb', 'cccc\ndddd', 'eeee']);
  });

  test('блок не влезает даже один — страница из одного блока, oversized', () => {
    const p = new Paginator();
    const paged = p.paginate(['short', 'loooooooooooooooooong-block', 'tail'], {
      limit: 10,
    });

    // short | oversized | tail — три страницы, элемент не рвём никогда
    expect(paged.pages).toHaveLength(3);

    const oversized = paged.pages[1];
    expect(oversized?.items).toEqual(['loooooooooooooooooong-block']);
    expect(oversized?.oversized).toBe(true);
    expect(oversized?.text).toBe('loooooooooooooooooong-block');

    expect(paged.pages[0]?.oversized).toBe(false);
    expect(paged.pages[2]?.oversized).toBe(false);
  });

  test('пустой список — isEmpty, page() возвращает undefined', () => {
    const p = new Paginator();
    const paged = p.paginate([], { limit: 10 });

    expect(paged.isEmpty).toBe(true);
    expect(paged.pages).toHaveLength(0);
    expect(paged.isSingle).toBe(false);
    expect(p.page(paged, 0)).toBeUndefined();
  });
});

describe('Paginator / курсоры и навигация', () => {
  test('курсоры start/prevStart/nextStart и флаги соседей', () => {
    const p = new Paginator();
    const paged = p.paginate(['a1', 'a2', 'a3', 'a4', 'a5', 'a6'], {
      limit: 5, // 2 блока на страницу (2+1+2=5)
    });

    expect(paged.pages).toHaveLength(3);

    const first = paged.pages[0];
    expect(first?.start).toBe(0);
    expect(first?.prevStart).toBeNull();
    expect(first?.nextStart).toBe(2);
    expect(first?.hasPrev).toBe(false);
    expect(first?.hasNext).toBe(true);

    const middle = paged.pages[1];
    expect(middle?.index).toBe(1);
    expect(middle?.start).toBe(2);
    expect(middle?.prevStart).toBe(0);
    expect(middle?.nextStart).toBe(4);
    expect(middle?.hasPrev).toBe(true);
    expect(middle?.hasNext).toBe(true);

    const last = paged.pages[2];
    expect(last?.index).toBe(2);
    expect(last?.start).toBe(4);
    expect(last?.prevStart).toBe(2);
    expect(last?.nextStart).toBeNull();
    expect(last?.hasNext).toBe(false);
  });

  test('total и index согласованы на каждой странице', () => {
    const p = new Paginator();
    const paged = p.paginate(['aa', 'bb', 'cc', 'dd'], { limit: 5 });

    for (const page of paged.pages) {
      expect(page.total).toBe(paged.pages.length);
    }
    expect(paged.pages.map((x) => x.index)).toEqual([0, 1]);
  });

  test('page(paged, n) — clamp к существующей странице', () => {
    const p = new Paginator();
    const paged = p.paginate(['aa', 'bb', 'cc', 'dd'], { limit: 5 });
    expect(paged.pages).toHaveLength(2);

    // Слишком большой номер — последняя страница
    expect(p.page(paged, 99)?.index).toBe(1);
    // Отрицательный — первая
    expect(p.page(paged, -1)?.index).toBe(0);
    // Корректные номера без изменений
    expect(p.page(paged, 0)?.index).toBe(0);
    expect(p.page(paged, 1)?.index).toBe(1);
  });
});

describe('Paginator / опции', () => {
  test('кастомная separator — склейка блоков в text', () => {
    const p = new Paginator();
    const paged = p.paginate(['x', 'y'], { limit: 100, separator: '\n\n' });

    expect(paged.pages[0]?.text).toBe('x\n\ny');
  });

  test('separator не влияет на меру — только на склейку text', () => {
    const p = new Paginator();
    // Σ мер = 3+3+3 = 9 ≤ 10 — одна страница даже с длинным separator
    const paged = p.paginate(['aaa', 'bbb', 'ccc'], {
      limit: 10,
      separator: '--',
    });

    expect(paged.isSingle).toBe(true);
    expect(paged.pages[0]?.text).toBe('aaa--bbb--ccc');
  });

  test('кастомная measure — web-мера по количеству элементов', () => {
    const p = new Paginator();
    const paged = p.paginate(
      ['очень длинный блок номер один', 'блок два', 'блок три', 'блок четыре'],
      { limit: 2, measure: () => 1 },
    );

    // По 2 элемента на страницу независимо от длины строк
    expect(paged.pages.map((x) => x.items)).toEqual([
      ['очень длинный блок номер один', 'блок два'],
      ['блок три', 'блок четыре'],
    ]);
  });

  test('дефолтная мера — символы строки', () => {
    const p = new Paginator();
    // Σ символов 5+5=10 ≤ 10 — одна страница (разделитель не в мере)
    const paged = p.paginate(['aaaaa', 'bbbbb'], { limit: 10 });

    expect(paged.isSingle).toBe(true);
    expect(paged.pages[0]?.text).toBe('aaaaa\nbbbbb');

    // 5+5+5=15 > 10 → разбивка по границе символьного лимита
    const split = p.paginate(['aaaaa', 'bbbbb', 'ccccc'], { limit: 10 });
    expect(split.pages.map((x) => x.text)).toEqual(['aaaaa\nbbbbb', 'ccccc']);
  });
});
