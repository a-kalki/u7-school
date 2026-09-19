/**
 * Транспорт-независимое ядро пагинации: страницы из ЦЕЛЫХ блоков.
 *
 * Ничего не знает о боте, Telegram, доменах и MarkdownV2 — работает со
 * строками-блоками (готовый контент) и мерой. Бот-специфика (лимит
 * Telegram, кнопки навигации) — в наследнике `BotPaginator`
 * (`ui/bot/page-nav.ts`). Второй потребитель — web-ui (мера по количеству
 * элементов). Элемент не рвём никогда: одинокий блок длиннее лимита —
 * страница из одного блока с флагом `oversized`.
 */

/** Опции разбиения на страницы. */
export interface PaginateOpts {
  /** Лимит меры на страницу (обязателен). */
  limit: number;
  /**
   * Мера блока. Дефолт — символы (длина строки); для web — по количеству
   * элементов (`() => 1`).
   */
  measure?: (block: string) => number;
  /** Разделитель блоков внутри страницы (дефолт `\n`): только склейка
   * `text`, в меру страницы не входит. */
  separator?: string;
}

/** Страница из целых блоков. */
export interface Page {
  /** Готовый текст страницы: блоки, склеенные separator — можно слать напрямую. */
  text: string;
  /** Блоки страницы — для web / кастомного рендера. */
  items: string[];
  /** Номер страницы, 0-based. */
  index: number;
  /** Всего страниц. */
  total: number;
  /** Курсор: индекс первого блока страницы. */
  start: number;
  /** Курсор: индекс первого блока предыдущей страницы; null на первой. */
  prevStart: number | null;
  /** Курсор: индекс первого блока следующей страницы; null на последней. */
  nextStart: number | null;
  /** Есть предыдущая страница. */
  hasPrev: boolean;
  /** Есть следующая страница. */
  hasNext: boolean;
  /** Страница из одного блока, чья мера превышает лимит (элемент не рвём). */
  oversized: boolean;
}

/** Результат разбиения. */
export interface Paged {
  pages: Page[];
  /** Список блоков пуст. */
  isEmpty: boolean;
  /** Ровно одна страница. */
  isSingle: boolean;
}

/**
 * Пагинатор — объект-сервис без состояния: разбиение детерминировано,
 * один и тот же список блоков даёт одинаковые страницы.
 */
export class Paginator {
  /**
   * Разбивает блоки на страницы из целых элементов.
   *
   * Мера страницы = Σ мер блоков (разделитель в меру не входит — он про
   * склейку текста; резерв лимита покрывает его длину).
   * Блок, не влезающий в пустую страницу, всё равно добавляется —
   * страница из одного блока помечается `oversized`.
   */
  paginate(blocks: string[], opts: PaginateOpts): Paged {
    const measure = opts.measure ?? ((block: string) => block.length);
    const separator = opts.separator ?? '\n';

    // Наборы блоков страниц
    const chunks: string[][] = [];
    const chunkMeasures: number[] = [];
    let current: string[] = [];
    let currentMeasure = 0;

    for (const block of blocks) {
      const m = measure(block);
      if (currentMeasure + m > opts.limit) {
        chunks.push(current);
        chunkMeasures.push(currentMeasure);
        current = [];
        currentMeasure = 0;
      }
      currentMeasure += m;
      current.push(block);
    }
    if (current.length > 0) {
      chunks.push(current);
      chunkMeasures.push(currentMeasure);
    }

    // Курсоры первых блоков страниц
    const starts: number[] = [];
    let cursor = 0;
    for (const chunk of chunks) {
      starts.push(cursor);
      cursor += chunk.length;
    }

    const pages: Page[] = chunks.map((items, index) => {
      const start = starts[index] ?? 0;
      const prevStart = index > 0 ? (starts[index - 1] ?? null) : null;
      const nextStart = starts[index + 1] ?? null;
      return {
        text: items.join(separator),
        items,
        index,
        total: chunks.length,
        start,
        prevStart,
        nextStart,
        hasPrev: index > 0,
        hasNext: index + 1 < chunks.length,
        oversized:
          items.length === 1 && (chunkMeasures[index] ?? 0) > opts.limit,
      };
    });

    return {
      pages,
      isEmpty: chunks.length === 0,
      isSingle: chunks.length === 1,
    };
  }

  /**
   * Доступ к странице с clamp: номер за пределами диапазона прижимается
   * к существующей странице (список мог сократиться — страница исчезла).
   * undefined — только для пустого разбора.
   */
  page(paged: Paged, n: number): Page | undefined {
    if (paged.pages.length === 0) return undefined;
    const clamped = Math.min(Math.max(n, 0), paged.pages.length - 1);
    return paged.pages[clamped];
  }
}
