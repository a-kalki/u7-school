import {
  assertMarkdownV2Safe,
  escapeMarkdown,
  getGlobalLogger,
} from '@u7-scl/core/shared';
import {
  assertDialogResponseMarkdownSafe,
  type BotSession,
  type BotUpdate,
  type DialogResponse,
  type KeyboardDescription,
  type NotificationPayload,
  type ProactiveSender,
} from '@u7-scl/core/ui';
import type { Api } from 'grammy';
import type { BotContext } from '../context';
import { decodeShortId, encodeShortId, isShortId } from './short-id';

/** Узкий тип reply_markup для editMessageText (грамми сужает его до inline).
 * Выведен из Grammy Api — без прямой зависимости от @grammyjs/types. */
type EditReplyMarkup = NonNullable<
  Parameters<Api['editMessageText']>[3]
>['reply_markup'];

// ── UUID-сжатие ──

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Штамп кнопки: последний сегмент callback_data вида `:~<seq36>`.
 *
 * `~` — общий маркер со shortId, но штамп всегда ДОПИСЫВАЕТСЯ в конец,
 * поэтому парсер берёт последний сегмент; shortId-сегменты в середине
 * кода не затрагиваются (коллизия §12.2 закрыта порядком).
 */
const STAMP_SEGMENT_RE = /^~[0-9a-z]+$/;

/** Сообщение при нажатии на кнопку без открытого диалога (до /start). */
const NO_DIALOG_MESSAGE = 'Наберите /start';

/** Сообщение при нажатии на кнопку чужого/устаревшего экрана (штамп не совпал). */
const STALE_STAMP_MESSAGE = 'Экран устарел — нажмите /start';

/** Сообщение при нажатии на устаревшую кнопку (shortId не найден в мапе). */
const STALE_BUTTON_MESSAGE =
  'Похоже, эта кнопка устарела после перезапуска сервиса. Нажмите /start, чтобы начать заново.';

/** Маркер выбора при retire экрана: «—————\nВы выбрали: …» (UX-запрос §10.6). */
const CHOICE_MARKER = '\n\n—————\nВы выбрали: ';

// ── Интерфейсы ──

/** Порт uiApp на контракте «Диалог и Экран» (реализуется BotUiApp в Фазе 3). */
export interface DialogUiAppPort {
  /** /start: закрыть диалог (seq++), вернуть welcome-экран */
  handleWelcome(tgId: number, session: BotSession): Promise<DialogResponse>;
  /** /help: контекстная справка стори или общий fallback — как info-реплика */
  handleHelp(tgId: number, session: BotSession): Promise<DialogResponse>;
  /** Нажатие кнопки (штамп и shortId уже сверены транспортом) */
  handleCallback(
    data: string,
    tgId: number,
    session: BotSession,
  ): Promise<DialogResponse | null>;
  /** Текстовый ввод при ожидающем диалоге */
  handleMessage(
    update: BotUpdate,
    tgId: number,
    session: BotSession,
  ): Promise<DialogResponse | null>;
  /** /cancel: доменная очистка стори, дефолт — меню */
  handleCancel(
    tgId: number,
    session: BotSession,
  ): Promise<DialogResponse | null>;
}

export interface BotUpdateHandler {
  handleStart(ctx: BotContext): Promise<void>;
  handleCallback(ctx: BotContext): Promise<void>;
  handleMessage(ctx: BotContext, next: () => Promise<void>): Promise<void>;
  handleCancel(ctx: BotContext): Promise<void>;
  handleHelp(ctx: BotContext): Promise<void>;
}

// ── BotTransport ──

/**
 * Единый транспортный слой между Grammy и uiApp на контракте
 * «Диалог и Экран» (bot-ui-session-architecture.md §5).
 *
 * Владеет:
 * - сессиями BotSession (диалог + активный экран) — внутренняя мапа;
 * - рендер-политикой: edit своего экрана / retire чужого + send;
 * - штампами `:~<seq36>` в callback_data (дописывание/сверка);
 * - сжатием/разжатием UUID в callback_data;
 * - per-chat очередью на ВСЕ апдейты и notify (в polling — no-op:
 *   грамми уже обрабатывает апдейты последовательно, очередь лишь
 *   сохраняет порядок и не переупорядочивает ничего).
 *
 * Ошибки Telegram API не глушатся — warn-лог (замена .catch(() => {})).
 */
export class BotTransport implements BotUpdateHandler, ProactiveSender {
  private readonly uiApp: DialogUiAppPort;
  private readonly botApi: Api;

  /** Сессии пользователей: tgId → BotSession (диалог + экран). */
  private readonly sessions = new Map<number, BotSession>();

  /** Единая мапа сжатых id на всё приложение. */
  private readonly shortIds = new Map<string, string>();

  /** Хвосты per-chat очередей: tgId → нормализованный хвост. */
  private readonly queues = new Map<number, Promise<void>>();

  constructor(uiApp: DialogUiAppPort, botApi: Api) {
    this.uiApp = uiApp;
    this.botApi = botApi;
  }

  // ═══════════════════════════════════════════
  // BotUpdateHandler — всё через per-chat очередь
  // ═══════════════════════════════════════════

  async handleStart(ctx: BotContext): Promise<void> {
    const tgId = ctx.from?.id;
    if (!tgId) return;

    await this.#enqueue(tgId, async () => {
      const session = this.#session(tgId);
      // uiApp закрывает диалог (seq++) и возвращает welcome-экран;
      // pressedCode нет → retire прежнего экрана без маркера выбора.
      const response = await this.uiApp.handleWelcome(tgId, session);
      await this.#render(tgId, session, response);
    });
  }

  async handleCallback(ctx: BotContext): Promise<void> {
    const tgId = ctx.from?.id;
    const rawData = ctx.callbackQuery?.data;
    if (!tgId || !rawData) return;

    await this.#enqueue(tgId, async () => {
      const session = this.#session(tgId);

      // 0. Диалог не открыт (до первого /start) → alert «Наберите /start»,
      //    до uiApp не доезжает (ФР-1/ФР-3: валидация без исключений).
      if (!session.dialog) {
        await this.#answerCallbackQuery(ctx, NO_DIALOG_MESSAGE);
        return;
      }

      // 1. Штамп — сверка первым делом: старый экран, кнопка из истории,
      //    гонка, рестарт, крафтовый ~0 или легаси-код без штампа → alert,
      //    до uiApp не доезжает (И2). Штампы валидны от 1.
      const { data, stamp } = this.#splitStamp(rawData);
      if (stamp === null || stamp < 1 || stamp !== session.dialog.seq) {
        await this.#answerCallbackQuery(ctx, STALE_STAMP_MESSAGE);
        return;
      }

      // 2. Разжатие shortId: кнопка из прошлой жизни сервиса → alert.
      const expanded = this.expandAction(data);
      if (expanded.stale) {
        await this.#answerCallbackQuery(ctx, STALE_BUTTON_MESSAGE);
        return;
      }

      // 3. Маршрутизация в uiApp и рендер ответа.
      const response = await this.uiApp.handleCallback(
        expanded.data,
        tgId,
        session,
      );
      if (response) {
        await this.#render(tgId, session, response, {
          pressedCode: expanded.data,
        });
      }
      await this.#answerCallbackQuery(ctx);
    });
  }

  async handleMessage(
    ctx: BotContext,
    next: () => Promise<void>,
  ): Promise<void> {
    const text = ctx.message?.text;
    if (!text || text.startsWith('/')) return next();

    const tgId = ctx.from?.id;
    if (!tgId) return;

    // Быстрая проверка без создания сессии: нечего маршрутизировать.
    const existing = this.sessions.get(tgId);
    if (!existing?.dialog?.input) return next();

    await this.#enqueue(tgId, async () => {
      const session = this.#session(tgId);
      // Повторная проверка внутри слота очереди — к моменту исполнения
      // ввод мог быть снят параллельной кнопкой.
      if (!session.dialog?.input) {
        await next();
        return;
      }

      const update: BotUpdate = {
        type: 'message',
        text,
        telegramId: tgId,
      };
      const response = await this.uiApp.handleMessage(update, tgId, session);
      if (response === null) {
        await next();
        return;
      }
      await this.#render(tgId, session, response);
    });
  }

  async handleCancel(ctx: BotContext): Promise<void> {
    const tgId = ctx.from?.id;
    if (!tgId) return;

    await this.#enqueue(tgId, async () => {
      const session = this.#session(tgId);
      const response = await this.uiApp.handleCancel(tgId, session);
      // null → тихий пропуск; дефолт-меню возвращает uiApp (Фаза 3).
      if (response) {
        await this.#render(tgId, session, response);
      }
    });
  }

  async handleHelp(ctx: BotContext): Promise<void> {
    const tgId = ctx.from?.id;
    if (!tgId) return;

    await this.#enqueue(tgId, async () => {
      const session = this.#session(tgId);
      // uiApp возвращает info-реплику (контекстный handleHelp стори или
      // общий fallback) — диалог и экран не трогаются.
      const response = await this.uiApp.handleHelp(tgId, session);
      await this.#render(tgId, session, response);
    });
  }

  // ═══════════════════════════════════════════
  // ProactiveSender
  // ═══════════════════════════════════════════

  /**
   * Проактивное уведомление — единственный проактивный канал (И3):
   * не читает и не пишет сессию, не трогает экран и диалог.
   * Тон-каналы: notice (по умолчанию) — 🔔 «Уведомление»;
   * info — ℹ️ «Информация» в стилистике уведомлений.
   */
  async notify(
    telegramId: number,
    payload: NotificationPayload,
  ): Promise<void> {
    return this.#enqueue(telegramId, async () => {
      const header =
        (payload.tone ?? 'notice') === 'notice'
          ? '🔔 *Уведомление:*\n\n'
          : 'ℹ️ *Информация:*\n\n';
      const text = header + payload.text;

      // Fail-fast: битые md-литералы не уходят в Telegram.
      assertMarkdownV2Safe(text);
      await this.#sendText(telegramId, text);
    });
  }

  /**
   * Мягкий кик пользователя из Telegram-группы (FR-6).
   *
   * ban на 60 секунд + мгновенный unban — пользователь удалён из группы,
   * но может вернуться по инвайту. Ошибки (бот не админ, группа не найдена)
   * логируются и не всплывают наружу — снятие с учёбы не ломается.
   */
  async kickFromGroup(groupId: number | string, userId: number): Promise<void> {
    try {
      await this.botApi.banChatMember(groupId, userId, {
        until_date: Math.floor(Date.now() / 1000) + 60,
      });
      await this.botApi.unbanChatMember(groupId, userId);
      getGlobalLogger()?.info(
        'bot-transport',
        `Пользователь ${userId} исключён из группы ${groupId}`,
      );
    } catch (err) {
      getGlobalLogger()?.warn(
        'bot-transport',
        `Не удалось исключить пользователя ${userId} из группы ${groupId} (бот не админ?): ${String(err)}`,
      );
    }
  }

  // ═══════════════════════════════════════════
  // Рендер-политика §5 — единая точка исполнения
  // ═══════════════════════════════════════════

  /**
   * Исполняет DialogResponse по правилам §5.
   *
   * @param opts.pressedCode — код нажатой кнопки (после снятия штампа и
   *   разжатия shortId); по нему ищется текст для маркера выбора при
   *   retire. Отсутствует для команд (/start, /cancel) и сообщений —
   *   тогда retire без маркера.
   */
  async #render(
    tgId: number,
    session: BotSession,
    response: DialogResponse,
    opts: { pressedCode?: string } = {},
  ): Promise<void> {
    // Fail-fast: битые md-литералы не уходят в Telegram.
    assertDialogResponseMarkdownSafe(response);

    // 1. info — тихая реплика поверх диалога (без клавиатуры, сессию
    //    и экран не трогает). Уходит первой — читается «над» новым экраном.
    if (response.info) {
      await this.#sendText(tgId, response.info.text);
    }

    // Слоты ниже требуют открытого диалога (ФР-1): /help и info-реплики
    // возможны и без него — все прочие ответы — программная ошибка,
    // warn-лог и пропуск (не падение).
    if (!session.dialog) {
      if (
        response.finalize ||
        response.screen ||
        response.awaitInput ||
        response.release
      ) {
        getGlobalLogger()?.warn(
          'bot-transport',
          'ответ с экраном/вводом при закрытом диалоге пропущен',
          { tgId },
        );
      }
      return;
    }
    const dialog = session.dialog;

    // 2. finalize — перезапись активного экрана (фиксация выбора).
    //    Только своего: ownerSeq === dialog.seq, иначе warn-лог и пропуск.
    if (response.finalize) {
      const screen = session.screen;
      if (screen && screen.ownerSeq === dialog.seq) {
        await this.#editMessage(tgId, screen.messageId, response.finalize.text);
        screen.text = response.finalize.text;
        screen.keyboard = undefined;
      } else {
        getGlobalLogger()?.warn(
          'bot-transport',
          'finalize пропущен: активный экран не принадлежит текущему диалогу',
          { tgId, ownerSeq: screen?.ownerSeq, seq: dialog.seq },
        );
      }
    }

    // 3. screen — владеешь экраном (и без finalize) → edit на месте;
    //    иначе → retire прежнего (маркер выбора при известном коде) + send.
    if (response.screen) {
      const current = session.screen;
      if (current?.ownerSeq === dialog.seq && !response.finalize) {
        await this.#editMessage(
          tgId,
          current.messageId,
          response.screen.text,
          response.screen.keyboard
            ? this.#telegramKeyboard(response.screen.keyboard, dialog.seq)
            : undefined,
        );
        current.text = response.screen.text;
        current.keyboard = response.screen.keyboard;
      } else {
        await this.#retireScreen(tgId, session, opts.pressedCode);
        const messageId = await this.#sendScreen(
          tgId,
          dialog.seq,
          response.screen,
        );
        if (messageId !== undefined) {
          session.screen = {
            messageId,
            ownerSeq: dialog.seq,
            text: response.screen.text,
            keyboard: response.screen.keyboard,
          };
        }
      }
    }

    // 4. awaitInput / release — ожидание текстового ввода диалога.
    if (response.awaitInput) {
      dialog.input = { context: response.awaitInput.context };
    }
    if (response.release) {
      dialog.input = undefined;
    }
    // delegate исполняется uiApp до транспорта — сюда не доезжает.
  }

  /** Снятие клавиатуры прошлого экрана (+ маркер выбора при известном коде). */
  async #retireScreen(
    tgId: number,
    session: BotSession,
    pressedCode?: string,
  ): Promise<void> {
    const screen = session.screen;
    // Нет экрана или клавиатуры — ретирить нечего (маркер не о чем).
    if (!screen?.keyboard) return;

    const marker = this.#choiceMarker(screen.keyboard, pressedCode);
    await this.#editMessage(tgId, screen.messageId, screen.text + marker);
    screen.keyboard = undefined;
  }

  /** Маркер «Вы выбрали: …»: текст кнопки ищется в клавиатуре по коду. */
  #choiceMarker(keyboard: KeyboardDescription, pressedCode?: string): string {
    if (!pressedCode) return '';
    const btn = keyboard.rows
      .flat()
      .find((b) => b.code === pressedCode && !b.url);
    if (!btn) return '';
    // Текст кнопки — plain: экранируем для вставки в MarkdownV2-сообщение.
    return `${CHOICE_MARKER}${escapeMarkdown(btn.text)}`;
  }

  // ── Отправка в Telegram (warn-лог вместо глушения) ──

  async #editMessage(
    tgId: number,
    messageId: number,
    text: string,
    replyMarkup?: EditReplyMarkup,
  ): Promise<void> {
    await this.botApi
      .editMessageText(tgId, messageId, text, {
        reply_markup: replyMarkup,
        parse_mode: 'MarkdownV2',
      })
      .catch((err: unknown) =>
        this.#warnTelegram('editMessageText', tgId, err),
      );
  }

  async #sendText(tgId: number, text: string): Promise<void> {
    await this.botApi
      .sendMessage(tgId, text, { parse_mode: 'MarkdownV2' })
      .catch((err: unknown) => this.#warnTelegram('sendMessage', tgId, err));
  }

  /** Отправляет экран; возвращает message_id (undefined при ошибке API). */
  async #sendScreen(
    tgId: number,
    seq: number,
    screen: { text: string; keyboard?: KeyboardDescription },
  ): Promise<number | undefined> {
    try {
      const sent = await this.botApi.sendMessage(tgId, screen.text, {
        reply_markup: screen.keyboard
          ? this.#telegramKeyboard(screen.keyboard, seq)
          : undefined,
        parse_mode: 'MarkdownV2',
      });
      return sent.message_id;
    } catch (err) {
      this.#warnTelegram('sendMessage', tgId, err);
      return undefined;
    }
  }

  /** Клавиатура для Telegram: сжатие UUID + штамп `:~<seq36>` (url — как есть). */
  #telegramKeyboard(
    kb: KeyboardDescription,
    seq: number,
  ): NonNullable<EditReplyMarkup> {
    return {
      inline_keyboard: kb.rows.map((row) =>
        row.map((btn) =>
          btn.url
            ? { text: btn.text, url: btn.url }
            : {
                text: btn.text,
                callback_data: this.#stamp(this.compressAction(btn.code), seq),
              },
        ),
      ),
    };
  }

  async #answerCallbackQuery(ctx: BotContext, text?: string): Promise<void> {
    await ctx
      .answerCallbackQuery(text ? { text, show_alert: true } : undefined)
      .catch((err: unknown) =>
        this.#warnTelegram('answerCallbackQuery', ctx.from?.id, err),
      );
  }

  #warnTelegram(op: string, tgId: number | undefined, err: unknown): void {
    getGlobalLogger()?.warn('bot-transport', `Ошибка Telegram API (${op})`, {
      tgId,
      error: String(err),
    });
  }

  // ═══════════════════════════════════════════
  // Сессии и per-chat очередь
  // ═══════════════════════════════════════════

  /**
   * Сессия чата; создаётся лениво ПУСТОЙ (ФР-1): до первого /start диалог
   * не открыт (`dialog === undefined`), штампы у кнопок не валидны.
   */
  #session(tgId: number): BotSession {
    let session = this.sessions.get(tgId);
    if (!session) {
      session = {};
      this.sessions.set(tgId, session);
    }
    return session;
  }

  /**
   * Ставит работу в per-chat очередь: строгий порядок на чат,
   * разные чаты не блокируют друг друга. Ошибка предыдущей работы
   * не роняет хвост (хвост нормализован).
   *
   * Покрывает и webhook (нет встроенной сериализации), и конкуренцию
   * notify с апдейтами; в polling — no-op (грамми уже последователен).
   */
  #enqueue<T>(tgId: number, fn: () => Promise<T>): Promise<T> {
    const prev = this.queues.get(tgId) ?? Promise.resolve();
    const next = prev.then(fn, fn); // ошибка предыдущего НЕ роняет хвост
    this.queues.set(
      tgId,
      next.then(
        () => undefined,
        () => undefined,
      ),
    );
    return next;
  }

  // ═══════════════════════════════════════════
  // Штампы `:~<seq36>`
  // ═══════════════════════════════════════════

  /** Дописывает штамп к (уже сжатому) коду кнопки. */
  #stamp(code: string, seq: number): string {
    return `${code}:~${seq.toString(36)}`;
  }

  /**
   * Снимает последний сегмент-штамп, если он им является.
   * `stamp === null` — штампа нет (легаси-кнопка до деплоя).
   */
  #splitStamp(raw: string): { data: string; stamp: number | null } {
    const idx = raw.lastIndexOf(':');
    if (idx === -1) return { data: raw, stamp: null };

    const last = raw.slice(idx + 1);
    if (!STAMP_SEGMENT_RE.test(last)) {
      return { data: raw, stamp: null };
    }
    return {
      data: raw.slice(0, idx),
      stamp: Number.parseInt(last.slice(1), 36),
    };
  }

  // ═══════════════════════════════════════════
  // Сжатие / разжатие UUID
  // ═══════════════════════════════════════════

  /** Сжимает все UUID в callback_data. */
  private compressAction(raw: string): string {
    if (raw.startsWith('app:')) {
      return raw;
    }

    const parts = raw.split(':');
    return parts
      .map((part) => (UUID_RE.test(part) ? this.shrink(part) : part))
      .join(':');
  }

  /** Сжимает значение id в короткий ключ с маркером shortId. */
  private shrink(value: string): string {
    const base = value.slice(0, 8);

    // Гарантия уникальности: цикл с проверкой, а не одноразовая догадка.
    // Суффикс добавляется только при реальной коллизии с ДРУГИМ значением.
    let suffix: number | undefined;
    let key = encodeShortId(base);
    let existing = this.shortIds.get(key);
    while (existing !== undefined && existing !== value) {
      suffix = (suffix ?? 0) + 1;
      key = encodeShortId(base, suffix);
      existing = this.shortIds.get(key);
    }

    this.shortIds.set(key, value);
    return key;
  }

  /**
   * Разжимает сжатые UUID в callback_data (обратная операция к compressAction).
   *
   * Возвращает `{ data, stale }`: `stale = true`, если в данных есть shortId,
   * которого нет в мапе (устаревшая кнопка из прошлой жизни сервиса).
   */
  private expandAction(raw: string): { data: string; stale: boolean } {
    const parts = raw.split(':');
    let stale = false;
    const data = parts
      .map((part) => {
        // Не shortId (обычный сегмент) — оставляем как есть.
        if (!isShortId(part)) return part;

        const { hexKey, suffix } = decodeShortId(part)!;
        const key = encodeShortId(hexKey, suffix);
        const value = this.shortIds.get(key);
        if (value === undefined) {
          // Сжатый id, которого нет в мапе — устаревшая кнопка.
          stale = true;
          return part;
        }
        return value;
      })
      .join(':');
    return { data, stale };
  }
}
