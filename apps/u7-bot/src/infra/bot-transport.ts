import type { BotCommand, ProactiveSender, SessionData } from '@u7-scl/core/ui';
import type { Api } from 'grammy';
import type { BotContext } from '../context';
import type { U7BotUiApp } from '../core/ui-app';

// ── UUID-сжатие ──

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

    const data = this.expandAction(ctx.callbackQuery.data);

    const response = await this.uiApp.handleCallback(data, tgId, ctx.session);

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

  // ═══════════════════════════════════════════
  // execute — единая точка отправки
  // ═══════════════════════════════════════════

  private async execute(
    session: SessionData,
    tgId: number,
    command: BotCommand,
  ): Promise<void> {
    // 1. editMessage
    if (command.editMessage) {
      const edit = command.editMessage;
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
      command.keepPrevKeyboard !== true &&
      session.lastBotMessage &&
      !command.editMessage
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
      command.sendMessages ??
      (command.sendMessage ? [command.sendMessage] : []);

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
        const delay = command.sendDelayMs ?? 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    // 3. releaseInput
    if (command.releaseInput) {
      session.activeHandler = null;
    }
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

  /** Сжимает значение id в короткий ключ. */
  private shrink(value: string): string {
    let key = value.slice(0, 8);

    const existing = this.shortIds.get(key);
    if (existing !== undefined && existing !== value) {
      key = `${key}-${this.shortIds.size}`;
    }

    this.shortIds.set(key, value);
    return key;
  }

  /** Разжимает сжатые UUID в callback_data (обратная операция к compressAction). */
  private expandAction(raw: string): string {
    const parts = raw.split(':');
    return parts.map((part) => this.shortIds.get(part) ?? part).join(':');
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
