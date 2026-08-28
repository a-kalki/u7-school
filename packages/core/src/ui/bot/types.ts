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

/** Описание сообщения (общий тип для отправки/редактирования) */
export interface MessageDescription {
  text: string;
  keyboard?: KeyboardDescription;
  parseMode?: 'MarkdownV2';
}

/**
 * Команда транспорту — «приказ» что исполнить: отправить / отредактировать
 * сообщение, изменить состояние сессии (захват/освобождение ввода).
 *
 * Это то, что BotTransport.execute() реально исполняет.
 */
export interface BotCommand {
  sendMessage?: SendMessageDescription;
  /** Несколько сообщений подряд (welcome + вопрос и т.п.) */
  sendMessages?: SendMessageDescription[];
  editMessage?: EditMessageDescription;
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
}

/**
 * Реакция стори/контроллера на действие пользователя.
 * Расширяет BotCommand маршрутной директивой delegate, которую BotUiApp
 * обрабатывает ДО передачи команды транспорту.
 */
export interface BotResponse extends BotCommand {
  /** Делегирование обработки другому обработчику */
  delegate?: { path: string };
}

/**
 * Payload проактивного уведомления.
 *
 * Только текст — кнопки в уведомлении невозможны по построению (типом).
 * Проактивное сообщение с кнопками — это обычный send(): новый экран
 * ломает текущий флоу (клавиатура предыдущего сообщения снимается).
 *
 * Реализация транспорта обязана:
 * - пометить сообщение заголовком уведомления (🔔);
 * - сохранить клавиатуру предыдущего экрана (keepPrevKeyboard);
 * - НЕ делать уведомление последним сообщением сессии (lastBotMessage
 *   не трогается) и не захватывать ввод.
 */
export interface NotificationPayload {
  text: string;
  parseMode?: 'MarkdownV2';
}

/**
 * Проактивный отправитель сообщений бота.
 *
 * Цепочка `transport → BotUiApp → BotController → BotUiStory`: каждый уровень
 * реализует этот интерфейс и передаёт себя дочернему уровню через `init`
 * отдельным аргументом (не через resolve).
 */
export interface ProactiveSender {
  send(telegramId: number, command: BotCommand): Promise<void>;

  /** Проактивное уведомление — не вмешивается в поток пользователя */
  notify(telegramId: number, payload: NotificationPayload): Promise<void>;
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

export type BotUpdate =
  | { type: 'command'; command: string; telegramId: number; name?: string }
  | { type: 'message'; text: string; telegramId: number }
  | { type: 'callback'; data: string; telegramId: number; messageId: number }
  | { type: 'document'; fileId: string; telegramId: number }
  | { type: 'photo'; fileId: string; telegramId: number }
  | { type: 'voice'; fileId: string; telegramId: number };
