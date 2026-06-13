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
}

export type BotUpdate =
  | { type: 'command'; command: string; telegramId: number; name?: string }
  | { type: 'message'; text: string; telegramId: number }
  | { type: 'callback'; data: string; telegramId: number; messageId: number }
  | { type: 'document'; fileId: string; telegramId: number }
  | { type: 'photo'; fileId: string; telegramId: number }
  | { type: 'voice'; fileId: string; telegramId: number };
