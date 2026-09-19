import type { Page } from '../pagination/paginator';
import { Paginator } from '../pagination/paginator';
import { btn, type KbButton } from './response-builders';

/** Опции лимита контента страниц. */
export interface BotLimitOpts {
  /**
   * Клиент сам распорядился бюджетом («попросил полную длину»):
   * ровно столько символов на контент страниц, шапка и резерв
   * НЕ вычитаются — клиент уже всё учёл.
   */
  fullLength?: number;
}

/**
 * Бот-наследник ядра `Paginator` (паттерн как `UiStory → BotUiStory`):
 * лимит Telegram, ряд кнопок навигации, индикатор страницы. Без состояния
 * и без знания доменов.
 */
export class BotPaginator extends Paginator {
  /** Лимит Telegram на длину текста сообщения. */
  static readonly TELEGRAM_TEXT_LIMIT = 4096;

  /**
   * Резерв лимита: индикатор «Стр. N/M», разделители блоков и запас
   * на округления меры.
   */
  static readonly LIMIT_RESERVE = 64;

  /**
   * Дефолтный запас на сопровождающий текст (шапку экрана) — когда
   * клиент не передал её длину, место для неё всё равно остаётся.
   */
  static readonly HEADER_RESERVE = 256;

  /**
   * Лимит меры блоков страницы: 4096 − шапка − резерв.
   *
   * Шапка (сопровождающий текст) повторяется на каждой странице,
   * индикатор и разделители покрывает резерв. По умолчанию длина шапки
   * неизвестна — вычитается дефолтный HEADER_RESERVE (запас для шапки
   * остаётся всегда). `fullLength` — клиент сам распорядился длиной
   * контента: используется как есть, без вычетов.
   */
  botLimit(headerLength?: number, opts?: BotLimitOpts): number {
    if (opts?.fullLength !== undefined) return opts.fullLength;
    const header = headerLength ?? BotPaginator.HEADER_RESERVE;
    return (
      BotPaginator.TELEGRAM_TEXT_LIMIT - header - BotPaginator.LIMIT_RESERVE
    );
  }

  /**
   * Ряд навигации `‹ Пред` / `След ›` — ОДНИМ рядом (над «Назад»).
   * Кнопки только при наличии соседней страницы. cb строит полный
   * callback-код по номеру страницы (0-based): номер — числовой сегмент
   * в конце кода, UUID-сжатие транспорта его не трогает.
   */
  navRows(page: Page, cb: (pageIndex: number) => string): KbButton[][] {
    const row: KbButton[] = [];
    if (page.hasPrev) {
      row.push(btn('‹ Пред', cb(page.index - 1)));
    }
    if (page.hasNext) {
      row.push(btn('След ›', cb(page.index + 1)));
    }
    return row.length > 0 ? [row] : [];
  }

  /**
   * Индикатор «Стр. N/M» (номер 1-based для пользователя).
   * undefined на единственной странице — не мешаем коротким спискам.
   */
  indicator(page: Page): string | undefined {
    if (page.total <= 1) return undefined;
    return `Стр. ${page.index + 1}/${page.total}`;
  }
}
