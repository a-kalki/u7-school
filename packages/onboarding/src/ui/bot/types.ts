/**
 * Входящие события от бота.
 */
export type BotUpdate =
  | { type: 'message'; text: string; telegramId: number; name: string }
  | { type: 'callback'; data: string; telegramId: number; messageId: number }
  | { type: 'command'; command: string; telegramId: number; name: string };

/**
 * Описание сообщения для отправки или редактирования.
 */
export interface MessageDescription {
  text: string;
  keyboard?: KeyboardDescription;
  parseMode?: 'MarkdownV2' | 'HTML';
}

/**
 * Инструкция для бота (результат работы контроллера).
 */
export type BotResponse = {
  /** Если задано, бот должен отредактировать указанное сообщение */
  editMessage?: MessageDescription & { messageId: number };
  /** Если задано, бот должен отправить новое сообщение */
  sendMessage?: MessageDescription;
  /** Флаг завершения анкеты — сигнал боту сбросить меню на 'main' */
  questionnaireCompleted?: true;
};

/**
 * Описание inline-клавиатуры.
 */
export interface KeyboardDescription {
  rows: { text: string; code: string }[][];
  isMultiple: boolean;
}
