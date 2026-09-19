import type { Page } from '../pagination/paginator';
import { Paginator } from '../pagination/paginator';
import { btn, type KbButton } from './response-builders';

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
   * Лимит меры блоков страницы: 4096 − длина шапки экрана − резерв.
   * Шапка повторяется на каждой странице, индикатор и разделители
   * покрывает резерв.
   */
  botLimit(headerLength: number): number {
    return (
      BotPaginator.TELEGRAM_TEXT_LIMIT -
      headerLength -
      BotPaginator.LIMIT_RESERVE
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
