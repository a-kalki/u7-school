/** Общие типы для UI-слоя Telegram-бота */

import type { MdText } from '../../shared/markdown';

/**
 * Описание inline-клавиатуры.
 *
 * Конвенция: текст кнопок (`rows[].text`) — всегда plain text.
 * Telegram НЕ парсит MarkdownV2 в кнопках, поэтому экранирование
 * `escapeMarkdown()` для текста кнопок не нужно и портит отображение
 * (будут видны бэкслеши).
 *
 * Коды — `story:action[:id...]` без префикса контроллера (префиксует
 * контроллер), без сжатия и штампа (транспорт сжимает и штампует).
 *
 * Мостом в другой диалог признаётся любая валидная кнопка текущего
 * экрана — отдельное поле `takeover` удалено (контракт «Диалог и Экран»).
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
 * Payload проактивного уведомления (контракт «Диалог и Экран»).
 *
 * Только текст — кнопки в уведомлении невозможны по построению (типом).
 * Единственный проактивный канал: не читает и не пишет сессию,
 * не трогает экран и диалог (инвариант И3).
 *
 * Тон определяет оформление реплики транспортом:
 * - `notice` (по умолчанию) — 🔔 «Уведомление»;
 * - `info` — тихая реплика без заголовка.
 */
export interface NotificationPayload {
  text: MdText;
  tone?: 'notice' | 'info';
}

/**
 * Проактивный отправитель сообщений бота (контракт «Диалог и Экран»).
 *
 * Цепочка `transport → BotUiApp → BotController → BotUiStory`: каждый уровень
 * реализует этот интерфейс и передаёт себя дочернему уровню через `init`
 * отдельным аргументом (не через resolve).
 *
 * Проактивный запуск диалога (send с BotCommand) удалён: невоспроизводим
 * синтаксически — только notify без кнопок и без влияния на сессию.
 */
export interface ProactiveSender {
  /** Проактивное уведомление — не вмешивается в поток пользователя */
  notify(telegramId: number, payload: NotificationPayload): Promise<void>;

  /**
   * Мягкий кик пользователя из Telegram-группы: ban на минуту + мгновенный
   * unban. Пользователь исключён, но может вернуться по инвайту.
   * Ошибки (бот не админ, группа не найдена) не всплывают наружу.
   */
  kickFromGroup(groupId: number | string, userId: number): Promise<void>;
}

// ── Контракт «Диалог и Экран» (bot-ui-session-architecture.md §4) ──

/**
 * Экран — сообщение бота с (опц.) клавиатурой.
 *
 * `keyboard` имеет смысл только у активного экрана диалога; в `info`
 * (тихой реплике) клавиатура транспортом не рендерится.
 */
export interface Screen {
  text: MdText;
  keyboard?: KeyboardDescription;
}

/**
 * Ответ стори/контроллера — максимально декларативный (замена BotResponse).
 *
 * Три способа повлиять на чат (`screen`/`info`/`finalize`), два — на ввод
 * (`awaitInput`/`release`), один — на маршрут (`delegate`, исполняется
 * uiApp до транспорта). Чего нет: `messageId`, `keepPrevKeyboard`,
 * `sendMessages`, `parseMode`, `captureInput.path`, `takeover`, `ttlSeconds`.
 */
export interface DialogResponse {
  /** Показать экран диалога (edit своего / retire чужого + send) */
  screen?: Screen;
  /** Перезаписать активный экран (фиксация выбора), клавиатура снимается */
  finalize?: { text: MdText };
  /** Тихая реплика поверх диалога (без клавиатуры, сессию не трогает) */
  info?: Screen;
  /** Ждать текстовый ввод (path уже известен — это dialog.path) */
  awaitInput?: { context?: unknown };
  /** Снять ожидание текста (диалог живёт на финальном экране) */
  release?: boolean;
  /** Программный переход: seq++, рендер экрана целевой стори (исполняет uiApp) */
  delegate?: { path: string };
}

/**
 * Состояние диалога (владение — uiApp и транспорт).
 *
 * Диалог открывается операцией входа (`/start`, мост) — до этого
 * `BotSession.dialog === undefined` («диалог не открыт"). После первого
 * /start — это диалог меню. Смена диалога — только командой или мостом;
 * `seq` — монотонный штамп, проставляемый транспортом в callback_data
 * и сверяемый при приёме (валиден от 1).
 */
export interface DialogState {
  /** `controller/story`, например 'questionnaire/fill' */
  path: string;
  /** Штамп диалога (инкремент при смене диалога — uiApp) */
  seq: number;
  /** Ожидание текстового ввода (без expiresAt — TTL удалён, §7) */
  input?: { context?: unknown };
}

/**
 * Состояние активного экрана (владение — транспорт, messageId знает только он).
 *
 * `text`/`keyboard` хранятся для retire: снятие клавиатуры + маркер выбора.
 */
export interface ScreenState {
  messageId: number;
  /** seq диалога-владельца */
  ownerSeq: number;
  /** MdText (для retire-маркера) */
  text: string;
  /** Для retire: снятие + поиск текста кнопки */
  keyboard?: KeyboardDescription;
}

/**
 * Сессия пользователя в контракте «Диалог и Экран» (всё сериализуемо).
 *
 * `dialog === undefined` — явное состояние «диалог не открыт»: до первого
 * /start сессия не содержит фиктивного диалога (ФР-1, трек 1.1).
 */
export interface BotSession {
  dialog?: DialogState;
  screen?: ScreenState;
}

/**
 * Данные сессии пользователя с отслеживанием активного обработчика
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
 * Конверт слэш-команды (ФР-4): транспорт парсирует слэш-текст, ядро
 * и стори получают только разобранный конверт.
 *
 * Правило парсинга (транспорт): команда — всегда первый токен после
 * ведущего `/`; суффикс `@botname` отбрасывается; всё после первого
 * токена — `args` одной строкой (стори сам решает, что с ним делать).
 */
export type CommandUpdate = {
  type: 'command';
  /** Имя команды без `/` и суффикса @botname (напр. 'start') */
  command: string;
  /** Всё после первого токена, одной строкой (может быть пусто) */
  args: string;
  telegramId: number;
  /** first_name отправителя — для гост-регистрации на /start */
  name?: string;
  /** @username отправителя без собаки */
  username?: string;
};

/**
 * Реакция на команду в трёхуровневом pipe (ФР-4, решения 2026-09-06).
 *
 * Единый тип для стори и контроллера — ядро имён команд не знает:
 * - `pass` — «не моё», обход продолжается без вклада;
 * - `continue` — «моё», обход продолжается, вклад — только текст-нотис
 *   (агрегируется склейкой через \n\n);
 * - `stop` — терминал: конвейер закончен, `response` (info-only /
 *   screen / пусто) — итоговый ответ; накопленные к этому моменту
 *   нотисы uiApp ставит info-репликой над ответом.
 *
 * Дефолты уровня приложения (общий help, меню, «неизвестная команда»)
 * включаются, когда весь pipe вернул pass — ядро их не строит.
 */
export type CommandReaction =
  | { reaction: 'pass' }
  | { reaction: 'continue'; notice?: MdText }
  | { reaction: 'stop'; response: DialogResponse };
