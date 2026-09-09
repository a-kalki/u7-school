/** Общие типы для UI-слоя Telegram-бота */

import type { MdText } from '../../shared/markdown';

/**
 * Описание inline-клавиатуры.
 */
export interface KeyboardDescription {
  rows: {
    text: string;
    code: string;
    url?: string;
  }[][];
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
 * Вид уведомления — единый словарь для проактивных уведомлений
 */
export type NoticeKind = 'notify' | 'info' | 'warn';

/**
 * Payload проактивного уведомления (контракт «Диалог и Экран»).
 *
 * Вид определяет оформление реплики транспортом (единая таблица ФР-5):
 * - `notify` (по умолчанию) — 🔔 «Уведомление»;
 * - `info` — ℹ️ «Информация»;
 * - `warn` — ⚠️ «Внимание».
 */
export interface NotificationPayload {
  text: MdText;
  kind?: NoticeKind;
}

/**
 * Проактивный отправитель сообщений бота (контракт «Диалог и Экран»).
 */
export interface ProactiveSender {
  notify(telegramId: number, payload: NotificationPayload): Promise<void>;

  /**
   * ВРЕМЕННЫЙ проактив с кнопками (ФР-6): удаляется с приходом модуля
   * tasks-system. Кнопки штампуются seq диалога получателя на момент
   * отправки (легальная эпоха); получателю без диалога транспорт открывает
   * временный диалог-якорь приложения (seq = 1) — кнопки живы до смены
   * диалога (нажатие → switch в целевую стори, /start → reopen).
   */
  invite(
    telegramId: number,
    payload: { text: MdText; keyboard: KeyboardDescription },
  ): Promise<void>;

  /**
   * Мягкий кик пользователя из Telegram-группы
   */
  kickFromGroup(groupId: number | string, userId: number): Promise<void>;
}

// ── Контракт «Диалог и Экран» (bot-ui-session-architecture.md §4) ──

/**
 * Экран — сообщение бота с (опц.) клавиатурой.
 */
export interface Screen {
  text: MdText;
  keyboard?: KeyboardDescription;
}

/**
 * Ответ стори/контроллера — максимально декларативный.
 */
export interface DialogResponse {
  screen?: Screen;
  finalize?: { text: MdText };
  notify?: { text: MdText; kind?: NoticeKind };
  awaitInput?: { context?: unknown };
  release?: boolean;
  delegate?: { path: string };
}

/**
 * Состояние диалога (владение — uiApp и транспорт).
 */
export interface DialogState {
  path: string;
  seq: number;
  input?: { context?: unknown };
}

/**
 * Состояние активного экрана.
 */
export interface ScreenState {
  messageId: number;
  ownerSeq: number;
  text: string;
  keyboard?: KeyboardDescription;
}

/**
 * Сессия пользователя.
 */
export interface BotSession {
  dialog?: DialogState;
  screen?: ScreenState;
}

/**
 * Данные сессии пользователя
 */
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
  | CommandUpdate
  | { type: 'message'; text: string; telegramId: number }
  | { type: 'callback'; data: string; telegramId: number; messageId: number }
  | { type: 'document'; fileId: string; telegramId: number }
  | { type: 'photo'; fileId: string; telegramId: number }
  | { type: 'voice'; fileId: string; telegramId: number };

/**
 * Конверт слэш-команды
 */
export type CommandUpdate = {
  type: 'command';
  command: string;
  args: string;
  telegramId: number;
  name?: string;
  username?: string;
};

/**
 * Реакция на команду в трёхуровневом pipe
 */
export type CommandReaction =
  | { reaction: 'pass' }
  | { reaction: 'continue'; notice?: MdText }
  | { reaction: 'stop'; response: DialogResponse };
