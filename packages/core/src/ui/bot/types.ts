/** Общие типы для UI-слоя Telegram-бота */

/**
 * Описание inline-клавиатуры.
 *
 * Конвенция: текст кнопок (`rows[].text`) — всегда plain text.
 * Telegram НЕ парсит MarkdownV2 в кнопках, поэтому экранирование
 * `escapeMarkdown()` для текста кнопок не нужно и портит отображение
 * (будут видны бэкслеши).
 */
export interface KeyboardDescription {
  rows: { text: string; code: string; url?: string }[][];
  isMultiple: boolean;
}

export interface SendMessageDescription {
  text: string;
  keyboard?: KeyboardDescription;
  parseMode?: 'MarkdownV2';
}

export interface EditMessageDescription {
  messageId: number;
  text: string;
  keyboard?: KeyboardDescription;
  parseMode?: 'MarkdownV2';
}

export interface BotResponse {
  sendMessage?: SendMessageDescription;
  /** Несколько сообщений подряд (welcome + вопрос и т.п.) */
  sendMessages?: SendMessageDescription[];
  editMessage?: EditMessageDescription;
  questionnaireCompleted?: boolean;
  /** Задержка между сообщениями в sendMessages (мс), по умолчанию 1000 */
  sendDelayMs?: number;
  /** Сохранить клавиатуру у предыдущего сообщения бота.
   * По умолчанию (undefined) — клавиатура убирается.
   * Установить true только если контекст предыдущих кнопок всё ещё актуален. */
  keepPrevKeyboard?: boolean;
  /** Захват ввода — следующие сообщения пользователя пойдут в указанный обработчик */
  captureInput?: { path: string; context?: unknown; ttlSeconds?: number };
  /** Освобождение захваченного ввода */
  releaseInput?: boolean;
  /** Делегирование обработки другому обработчику */
  delegate?: { path: string };
}

/** Данные сессии пользователя с отслеживанием активного обработчика */
export interface SessionData {
  activeHandler: {
    path: string;
    context?: unknown;
    expiresAt?: number;
  } | null;
  /** Последнее отправленное ботом сообщение (для удаления клавиатуры и т.п.) */
  lastBotMessage?: SendMessageDescription & { messageId: number };
}

export type CbMainMenuAction = {
  kind: 'callback';
  text: string;
  action: string;
  priority: number;
  /** Описание для /help (если нет — пункт не включается в помощь) */
  description?: string;
};

export type UrlMainMenuAction = {
  kind: 'url';
  text: string;
  url: string;
  priority: number;
};

/** Элемент главного меню бота */
export type MainMenuAction = CbMainMenuAction | UrlMainMenuAction;

export type BotUpdate =
  | { type: 'command'; command: string; telegramId: number; name?: string }
  | { type: 'message'; text: string; telegramId: number }
  | { type: 'callback'; data: string; telegramId: number; messageId: number }
  | { type: 'document'; fileId: string; telegramId: number }
  | { type: 'photo'; fileId: string; telegramId: number }
  | { type: 'voice'; fileId: string; telegramId: number };

/** Агрегатор пунктов меню от всех контроллеров.
 * Реализуется BotRouter, передаётся в AppController. */
export interface MenuAggregator<TActor = unknown> {
  collectAllMenuItems(actor: TActor): Promise<MainMenuAction[]>;
  collectAllHelpDescriptions(actor: TActor): Promise<string[]>;
}
