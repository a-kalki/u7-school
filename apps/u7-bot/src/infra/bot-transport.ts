import { getGlobalLogger } from '@u7-scl/core/shared';
import {
  assertResponseMarkdownSafe,
  type BotCommand,
  type KeyboardDescription,
  type MessageDescription,
  type NotificationPayload,
  type ProactiveSender,
  type SessionData,
} from '@u7-scl/core/ui';
import type { Api } from 'grammy';
import type { BotContext } from '../context';
import type { U7BotUiApp } from '../core/ui-app';
import { decodeShortId, encodeShortId, isShortId } from './short-id';

// ── UUID-сжатие ──

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Сообщение при нажатии на устаревшую кнопку (shortId не найден в мапе). */
const STALE_BUTTON_MESSAGE =
  'Похоже, эта кнопка устарела после перезапуска сервиса. Нажмите /start, чтобы начать заново.';

/**
 * Строка-предупреждение для takeover-кнопок (spec FR-5).
 *
 * Абстрактная формулировка, не привязанная к анкетам: добавляется вниз
 * текста сообщения, несущего takeover-кнопки, когда у пользователя есть
 * активное действие. Нажатие takeover-кнопки перехватывает ввод (uiApp),
 * поэтому пользователь должен знать, что текущее действие завершится.
 */
function takeoverWarningLine(parseMode?: 'MarkdownV2'): string {
  return parseMode === 'MarkdownV2'
    ? '⚠️ Нажатие на кнопку приведёт к окончанию вашего текущего действия\\.'
    : '⚠️ Нажатие на кнопку приведёт к окончанию вашего текущего действия.';
}

/** Есть ли в клавиатуре takeover-кнопка (структурное поле, не маркер). */
function hasTakeoverButtons(kb?: KeyboardDescription): boolean {
  return kb?.rows.flat().some((btn) => btn.takeover === true) ?? false;
}

// ── Интерфейсы ──

export interface BotUpdateHandler {
  handleStart(ctx: BotContext): Promise<void>;
  handleCallback(ctx: BotContext): Promise<void>;
  handleMessage(ctx: BotContext, next: () => Promise<void>): Promise<void>;
  handleCancel(ctx: BotContext): Promise<void>;
  handleHelp(ctx: BotContext): Promise<void>;
}

// ── BotTransport ──

/**
 * Единый транспортный слой между Grammy и UiApp.
 *
 * Владеет:
 * - сессиями (через общий sessionMap)
 * - сжатием/разжатием UUID в callback_data
 * - исполнением BotCommand (отправка/редактирование/сессии)
 */
export class BotTransport implements BotUpdateHandler, ProactiveSender {
  private readonly uiApp: U7BotUiApp;
  private readonly botApi: Api;
  private readonly sessionMap: Map<number, SessionData>;

  /** Единая мапа сжатых id на всё приложение */
  private readonly shortIds = new Map<string, string>();

  constructor(
    uiApp: U7BotUiApp,
    botApi: Api,
    sessionMap: Map<number, SessionData>,
  ) {
    this.uiApp = uiApp;
    this.botApi = botApi;
    this.sessionMap = sessionMap;
  }

  // ═══════════════════════════════════════════
  // BotUpdateHandler
  // ═══════════════════════════════════════════

  async handleStart(ctx: BotContext): Promise<void> {
    const tgId = ctx.from?.id;
    if (!tgId) return;

    ctx.session.activeHandler = null;

    const response = await this.uiApp.handleWelcome(tgId);
    const compressed = this.compressCommand(response);
    await this.execute(ctx.session, tgId, compressed);
  }

  async handleCallback(ctx: BotContext): Promise<void> {
    const tgId = ctx.from?.id;
    if (!tgId || !ctx.callbackQuery?.data) return;

    const expanded = this.expandAction(ctx.callbackQuery.data);

    // Устаревшая кнопка (shortId не найден в мапе) — отвечаем сразу,
    // не обращаясь к UiApp.
    if (expanded.stale) {
      await ctx
        .answerCallbackQuery({
          text: STALE_BUTTON_MESSAGE,
          show_alert: true,
        })
        .catch(() => {});
      return;
    }

    const response = await this.uiApp.handleCallback(
      expanded.data,
      tgId,
      ctx.session,
    );

    // Проверка на «чужой callback» — показываем alert
    const alertText = response.sendMessage?.text;
    if (alertText?.includes('завершите текущее действие')) {
      await ctx
        .answerCallbackQuery({
          text: 'Сначала завершите текущее действие (/cancel)',
          show_alert: true,
        })
        .catch(() => {});
      return;
    }

    const compressed = this.compressCommand(response);
    await this.execute(ctx.session, tgId, compressed);
    await ctx.answerCallbackQuery().catch(() => {});
  }

  async handleMessage(
    ctx: BotContext,
    next: () => Promise<void>,
  ): Promise<void> {
    const text = ctx.message?.text;
    if (!text || text.startsWith('/')) return next();

    const tgId = ctx.from?.id;
    if (!tgId) return;

    // Нет активного обработчика — передаём управление дальше
    if (!ctx.session.activeHandler) {
      return next();
    }

    const update = {
      type: 'message' as const,
      text,
      telegramId: tgId,
    };

    const response = await this.uiApp.handleMessage(update, tgId, ctx.session);

    if (response === null) {
      return next();
    }

    const compressed = this.compressCommand(response);
    await this.execute(ctx.session, tgId, compressed);
  }

  async handleCancel(ctx: BotContext): Promise<void> {
    const tgId = ctx.from?.id;
    if (!tgId) return;

    const response = await this.uiApp.handleCancel(tgId, ctx.session);

    if (response === null) {
      await ctx.reply('Нечего отменять. Нажмите /start');
      return;
    }

    const compressed = this.compressCommand(response);
    await this.execute(ctx.session, tgId, compressed);
  }

  async handleHelp(ctx: BotContext): Promise<void> {
    const tgId = ctx.from?.id;
    if (!tgId) return;

    const response = await this.uiApp.handleHelp(tgId);
    const compressed = this.compressCommand(response);
    await this.execute(ctx.session, tgId, compressed);
  }

  // ═══════════════════════════════════════════
  // ProactiveSender
  // ═══════════════════════════════════════════

  async send(telegramId: number, command: BotCommand): Promise<void> {
    let session = this.sessionMap.get(telegramId);
    if (!session) {
      session = { activeHandler: null };
    }

    const compressed = this.compressCommand(command);
    await this.execute(session, telegramId, compressed);

    if (compressed.captureInput) {
      session.activeHandler = {
        path: compressed.captureInput.path,
        context: compressed.captureInput.context,
        expiresAt: compressed.captureInput.ttlSeconds
          ? Date.now() + compressed.captureInput.ttlSeconds * 1000
          : undefined,
      };
    }

    this.sessionMap.set(telegramId, session);
  }

  /**
   * Заголовок уведомления — первая строка сообщения.
   * В MarkdownV2 «Уведомление:» выделяется жирным.
   */
  #notificationHeader(parseMode?: 'MarkdownV2'): string {
    return parseMode === 'MarkdownV2'
      ? '🔔 *Уведомление:*\n\n'
      : '🔔 Уведомление:\n\n';
  }

  /**
   * Проактивное уведомление — не вмешивается в поток пользователя:
   * - помечено заголовком 🔔 (пользователю видно, что это уведомление);
   * - сохраняет клавиатуру предыдущего экрана (keepPrevKeyboard);
   * - не трогает activeHandler и lastBotMessage — уведомление НЕ становится
   *   последним сообщением, логика снятия клавиатуры продолжает работать
   *   по предыдущему экрану.
   */
  async notify(
    telegramId: number,
    payload: NotificationPayload,
  ): Promise<void> {
    let session = this.sessionMap.get(telegramId);
    if (!session) {
      session = { activeHandler: null };
    }

    const command: BotCommand = {
      sendMessage: {
        text: this.#notificationHeader(payload.parseMode) + payload.text,
        parseMode: payload.parseMode,
      },
      keepPrevKeyboard: true,
    };

    // Уведомление не занимает слот «последнего сообщения» сессии
    const prevLastBotMessage = session.lastBotMessage;
    const compressed = this.compressCommand(command);
    await this.execute(session, telegramId, compressed);
    session.lastBotMessage = prevLastBotMessage;

    this.sessionMap.set(telegramId, session);
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
  // execute — единая точка отправки
  // ═══════════════════════════════════════════

  private async execute(
    session: SessionData,
    tgId: number,
    command: BotCommand,
  ): Promise<void> {
    const prepared = this.#appendTakeoverWarning(command, session);

    // Fail-fast: перед отправкой проверяем MarkdownV2 — битый текст не уходит
    // в Telegram (единая точка проверки BotCommand, образец: ui-utils.ts).
    assertResponseMarkdownSafe(prepared);

    // 1. editMessage
    if (prepared.editMessage) {
      const edit = prepared.editMessage;
      const keyboard = edit.keyboard
        ? {
            inline_keyboard: edit.keyboard.rows.map((row) =>
              row.map((btn) =>
                btn.url
                  ? { text: btn.text, url: btn.url }
                  : { text: btn.text, callback_data: btn.code },
              ),
            ),
          }
        : undefined;

      await this.botApi
        .editMessageText(tgId, edit.messageId, edit.text, {
          reply_markup: keyboard,
          parse_mode: edit.parseMode,
        })
        .catch(() => {});

      // Обновляем lastBotMessage после редактирования
      if (session.lastBotMessage) {
        session.lastBotMessage = {
          ...session.lastBotMessage,
          text: edit.text,
          keyboard: edit.keyboard,
          parseMode: edit.parseMode ?? session.lastBotMessage.parseMode,
        };
      }
    }

    // 1.5. Удаление клавиатуры у предыдущего сообщения
    if (
      prepared.keepPrevKeyboard !== true &&
      session.lastBotMessage &&
      !prepared.editMessage
    ) {
      const prev = session.lastBotMessage;
      const keyboardRemoved = !prev.keyboard;

      if (!keyboardRemoved) {
        await this.botApi
          .editMessageText(tgId, prev.messageId, prev.text, {
            reply_markup: undefined,
            parse_mode: prev.parseMode,
          })
          .catch(() => {});
      }

      session.lastBotMessage = {
        ...prev,
        keyboard: undefined,
      };
    }

    // 2. sendMessage / sendMessages
    const toSend =
      prepared.sendMessages ??
      (prepared.sendMessage ? [prepared.sendMessage] : []);

    for (let i = 0; i < toSend.length; i++) {
      const send = toSend[i]!;
      const keyboard = send.keyboard
        ? {
            inline_keyboard: send.keyboard.rows.map((row) =>
              row.map((btn) =>
                btn.url
                  ? { text: btn.text, url: btn.url }
                  : { text: btn.text, callback_data: btn.code },
              ),
            ),
          }
        : undefined;

      const sent = await this.botApi.sendMessage(tgId, send.text, {
        reply_markup: keyboard,
        parse_mode: send.parseMode,
      });

      session.lastBotMessage = {
        text: send.text,
        keyboard: send.keyboard,
        parseMode: send.parseMode,
        messageId: sent.message_id,
      };

      // Задержка между сообщениями
      if (i < toSend.length - 1) {
        const delay = prepared.sendDelayMs ?? 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    // 3. releaseInput
    if (prepared.releaseInput) {
      session.activeHandler = null;
    }
  }

  /**
   * Добавляет предупреждающую строку вниз текста сообщений, несущих
   * takeover-кнопки, если у пользователя есть активное действие.
   *
   * Предупреждение добавляется ДО проверки MarkdownV2 (assertResponseMarkdownSafe),
   * чтобы приписанный текст тоже валидировался. Чужое сообщение (текущий
   * флоу) не редактируется — только текущее отправляемое/редактируемое.
   */
  #appendTakeoverWarning(
    command: BotCommand,
    session: SessionData,
  ): BotCommand {
    // Нет активного действия — предупреждать не о чем
    if (session.activeHandler == null) return command;

    const withWarning = <T extends MessageDescription>(desc: T): T => {
      if (!hasTakeoverButtons(desc.keyboard)) return desc;
      return {
        ...desc,
        text: `${desc.text}\n\n${takeoverWarningLine(desc.parseMode)}`,
      };
    };

    const result: BotCommand = { ...command };
    if (result.sendMessage) {
      result.sendMessage = withWarning(result.sendMessage);
    }
    if (result.sendMessages) {
      result.sendMessages = result.sendMessages.map(withWarning);
    }
    if (result.editMessage) {
      result.editMessage = withWarning(result.editMessage);
    }
    return result;
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

  /** Обходит BotCommand и сжимает все кнопки (code). */
  private compressCommand(command: BotCommand): BotCommand {
    const compressKeyboard = (
      kb: NonNullable<BotCommand['sendMessage']>['keyboard'],
    ): typeof kb => {
      if (!kb) return kb;
      return {
        ...kb,
        rows: kb.rows.map((row) =>
          row.map((btn) => ({
            ...btn,
            code: this.compressAction(btn.code),
          })),
        ),
      };
    };

    const result: BotCommand = { ...command };

    if (result.sendMessage?.keyboard) {
      result.sendMessage = {
        ...result.sendMessage,
        keyboard: compressKeyboard(result.sendMessage.keyboard) ?? undefined,
      };
    }

    if (result.sendMessages) {
      result.sendMessages = result.sendMessages.map((sm) => ({
        ...sm,
        keyboard: compressKeyboard(sm.keyboard) ?? undefined,
      }));
    }

    if (result.editMessage?.keyboard) {
      result.editMessage = {
        ...result.editMessage,
        keyboard: compressKeyboard(result.editMessage.keyboard) ?? undefined,
      };
    }

    return result;
  }
}
