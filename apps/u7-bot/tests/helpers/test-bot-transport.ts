import type { User } from '@u7-scl/app/domain';
import type { U7BotApp } from '@u7-scl/bot/u7-bot-app-meta';
import type { U7BotController } from '@u7-scl/bot/u7-bot-controller';
import { InProcEventBus } from '@u7-scl/core/infra';
import type {
  BotResponse,
  KeyboardDescription,
  SendMessageDescription,
  SessionData,
} from '@u7-scl/core/ui';
import type { Api } from 'grammy';
import type { BotContext } from '../../src/context';
import { U7BotUiApp } from '../../src/core/ui-app';
import { BotTransport } from '../../src/infra/bot-transport';
import type { TestApp } from './test-app';

// ── Записи вызовов мок-Api ──

export interface SentMessage {
  telegramId: number;
  messageId: number;
  text: string;
  parseMode?: 'MarkdownV2';
  keyboard?: KeyboardDescription;
}

export interface EditedMessage {
  telegramId: number;
  messageId: number;
  text: string;
  parseMode?: 'MarkdownV2';
  keyboard?: KeyboardDescription;
}

/** Запись мягкого кика из группы (bot-transport.kickFromGroup: ban + unban). */
export interface KickedMember {
  chatId: string | number;
  telegramId: number;
  unbanned: boolean;
}

interface RawReplyMarkup {
  inline_keyboard: Array<
    Array<{ text: string; callback_data?: string; url?: string }>
  >;
}

/**
 * Мок Grammy Api — записывает вызовы sendMessage / editMessageText в массивы,
 * возвращает инкрементальный message_id (как реальный Telegram).
 */
export class RecordingBotApi {
  readonly sentMessages: SentMessage[] = [];
  readonly editedMessages: EditedMessage[] = [];
  readonly kickedMembers: KickedMember[] = [];
  #nextMessageId = 1;

  reset(): void {
    this.sentMessages.length = 0;
    this.editedMessages.length = 0;
    this.kickedMembers.length = 0;
    this.#nextMessageId = 1;
  }

  async sendMessage(
    telegramId: number,
    text: string,
    other?: { reply_markup?: RawReplyMarkup; parse_mode?: 'MarkdownV2' },
  ): Promise<{ message_id: number }> {
    const messageId = this.#nextMessageId++;
    this.sentMessages.push({
      telegramId,
      messageId,
      text,
      parseMode: other?.parse_mode,
      keyboard: this.#toKeyboard(other?.reply_markup),
    });
    return { message_id: messageId };
  }

  async editMessageText(
    telegramId: number,
    messageId: number,
    text: string,
    other?: { reply_markup?: RawReplyMarkup; parse_mode?: 'MarkdownV2' },
  ): Promise<{ message_id: number }> {
    this.editedMessages.push({
      telegramId,
      messageId,
      text,
      parseMode: other?.parse_mode,
      keyboard: this.#toKeyboard(other?.reply_markup),
    });
    return { message_id: messageId };
  }

  /** Мягкий кик: banChatMember + unbanChatMember (bot-transport.kickFromGroup). */
  async banChatMember(
    chatId: string | number,
    telegramId: number,
    _other?: { until_date?: number },
  ): Promise<true> {
    this.kickedMembers.push({ chatId, telegramId, unbanned: false });
    return true;
  }

  async unbanChatMember(
    chatId: string | number,
    telegramId: number,
  ): Promise<true> {
    const record =
      this.kickedMembers.find(
        (k) =>
          String(k.chatId) === String(chatId) &&
          k.telegramId === telegramId &&
          !k.unbanned,
      ) ?? this.kickedMembers[this.kickedMembers.length - 1];
    if (record) {
      record.unbanned = true;
    }
    return true;
  }

  #toKeyboard(markup?: RawReplyMarkup): KeyboardDescription | undefined {
    if (!markup) return undefined;
    return {
      rows: markup.inline_keyboard.map((row) =>
        row.map((btn) => ({
          text: btn.text,
          code: btn.callback_data ?? '',
          url: btn.url,
        })),
      ),
      isMultiple: false,
    };
  }
}

/**
 * Честный тестовый BotTransport: реальный BotTransport + мок-Api +
 * реальная сессионная мапа + реальный U7BotUiApp.
 *
 * Методы handle* возвращают BotResponse, восстановленный из накопленных
 * вызовов мок-Api и состояния сессии (как это видит Telegram + сессия).
 */
export class TestBotTransport {
  readonly api = new RecordingBotApi();
  readonly sessionMap = new Map<number, SessionData>();
  readonly uiApp: U7BotUiApp;
  readonly transport: BotTransport;

  constructor(
    apiApp: U7BotApp,
    actorResolver: (tgId: number) => Promise<User>,
    controllers: U7BotController[],
    eventBus?: InProcEventBus,
  ) {
    this.uiApp = new U7BotUiApp(controllers);
    this.transport = new BotTransport(
      this.uiApp,
      this.api as unknown as Api,
      this.sessionMap,
    );
    this.uiApp.init(
      {
        // Общая с apiApp шина — события модулей (напр. questionnaire:start)
        // долетают до подписок стори (как в бою: create-ui-app + main.ts)
        eventBus: eventBus ?? new InProcEventBus(),
        actorResolver,
        appApi: apiApp,
        uiApp: this.uiApp,
      },
      this.transport,
    );
    // Подписки стори на доменные события (в бою вызывается в main.ts)
    this.uiApp.subscribeEvents();
  }

  /** Сбрасывает накопленные сообщения и сессии (изоляция между тестами). */
  reset(): void {
    this.api.reset();
    this.sessionMap.clear();
  }

  // ── Фабрика мок-контекста ──

  /**
   * Создаёт мок Grammy-контекст, привязанный к сессии из sessionMap.
   * Повторные вызовы для одного tgId возвращают одну и ту же сессию.
   */
  makeBotContext(
    tgId: number,
    opts: { callbackData?: string; text?: string } = {},
  ): BotContext {
    let session = this.sessionMap.get(tgId);
    if (!session) {
      session = { activeHandler: null };
      this.sessionMap.set(tgId, session);
    }

    return {
      from: { id: tgId, first_name: 'Test', is_bot: false },
      chat: { id: tgId, type: 'private' },
      session,
      reply: async () => ({ message_id: 0 }),
      answerCallbackQuery: async () => true,
      callbackQuery:
        opts.callbackData !== undefined
          ? { data: opts.callbackData }
          : undefined,
      message: opts.text !== undefined ? { text: opts.text } : undefined,
    } as unknown as BotContext;
  }

  // ── Меню ──

  collectMainMenu(actor: User) {
    return this.uiApp.collectMainMenu(actor);
  }

  // ── Обработчики ──

  async handleStart(ctx: BotContext): Promise<BotResponse> {
    return this.#run(ctx, () => this.transport.handleStart(ctx));
  }

  async handleCallback(ctx: BotContext): Promise<BotResponse> {
    return this.#run(ctx, () => this.transport.handleCallback(ctx));
  }

  async handleMessage(ctx: BotContext): Promise<BotResponse> {
    return this.#run(ctx, () =>
      this.transport.handleMessage(ctx, async () => {}),
    );
  }

  async handleCancel(ctx: BotContext): Promise<BotResponse> {
    return this.#run(ctx, () => this.transport.handleCancel(ctx));
  }

  async handleHelp(ctx: BotContext): Promise<BotResponse> {
    return this.#run(ctx, () => this.transport.handleHelp(ctx));
  }

  // ── Восстановление BotResponse ──

  async #run(ctx: BotContext, fn: () => Promise<void>): Promise<BotResponse> {
    const tgId = ctx.from?.id;
    const beforeActive = ctx.session?.activeHandler ?? null;
    const beforeLastText = ctx.session?.lastBotMessage?.text;
    const startIndex = this.api.sentMessages.length;
    const editStartIndex = this.api.editedMessages.length;

    await fn();

    // Только сообщения самого пользователя: проактивные уведомления другим
    // (напр. студенту после mark-abandoned ментором) — не часть его ответа
    const sent = this.api.sentMessages
      .slice(startIndex)
      .filter((m) => tgId === undefined || m.telegramId === tgId);
    const edited = this.api.editedMessages
      .slice(editStartIndex)
      .filter((m) => tgId === undefined || m.telegramId === tgId);
    const afterActive = ctx.session?.activeHandler ?? null;

    const response: BotResponse = {};

    const first = sent[0];
    if (sent.length === 1 && first) {
      response.sendMessage = this.#toSend(first);
    } else if (sent.length > 1) {
      response.sendMessages = sent.map((s) => this.#toSend(s));
    } else if (edited.length >= 1) {
      // Ответ был редактированием (editMessage). Отделяем его от удаления
      // клавиатуры у предыдущего сообщения (тот же текст, клавиатура снята).
      const last = edited[edited.length - 1];
      if (last) {
        const isRemoval =
          last.keyboard === undefined && last.text === beforeLastText;
        if (!isRemoval) {
          response.sendMessage = this.#toSend(last);
        }
      }
    }

    if (afterActive && afterActive !== beforeActive) {
      response.captureInput = {
        path: afterActive.path.split('/').slice(1).join('/'),
        context: afterActive.context,
        ttlSeconds: afterActive.expiresAt
          ? Math.max(1, Math.round((afterActive.expiresAt - Date.now()) / 1000))
          : undefined,
      };
    }

    if (beforeActive && !afterActive) {
      response.releaseInput = true;
    }

    return response;
  }

  #toSend(s: {
    text: string;
    keyboard?: KeyboardDescription;
    parseMode?: 'MarkdownV2';
  }): SendMessageDescription {
    return {
      text: s.text,
      keyboard: s.keyboard,
      parseMode: s.parseMode,
    };
  }
}

/**
 * Создаёт TestBotTransport из TestApp (стандартные фикстуры).
 * Использует общую с apiApp шину событий — проактивные сценарии работают.
 */
export function createTestBotTransport(
  app: TestApp,
  controllers: U7BotController[],
): TestBotTransport {
  return new TestBotTransport(
    app.apiApp,
    async (tgId) => {
      const user = await app.userFacade.getUserByTelegramId(tgId);
      if (!user) {
        throw new Error(`Пользователь с telegramId ${tgId} не найден`);
      }
      return user;
    },
    controllers,
    app.eventBus,
  );
}
