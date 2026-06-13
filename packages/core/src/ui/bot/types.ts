/** Общие типы для UI-слоя Telegram-бота */

export interface KeyboardDescription {
  rows: { text: string; code: string }[][];
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
}

export type BotUpdate =
  | { type: 'command'; command: string; telegramId: number; name?: string }
  | { type: 'message'; text: string; telegramId: number }
  | { type: 'callback'; data: string; telegramId: number; messageId: number }
  | { type: 'document'; fileId: string; telegramId: number }
  | { type: 'photo'; fileId: string; telegramId: number }
  | { type: 'voice'; fileId: string; telegramId: number };
