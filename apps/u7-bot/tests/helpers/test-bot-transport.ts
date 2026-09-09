import type { User } from '@u7-scl/app/domain';
import type { U7BotApp } from '@u7-scl/bot/u7-bot-app-meta';
import type { U7BotController } from '@u7-scl/bot/u7-bot-controller';
import { InProcEventBus } from '@u7-scl/core/infra';
import type { DialogResponse, KeyboardDescription } from '@u7-scl/core/ui';
import type { Api } from 'grammy';
import type { BotContext } from '../../src/context';
import type { U7BotUiAppResolve } from '../../src/core/u7-bot-app-meta';
import { U7BotUiApp } from '../../src/core/ui-app';
import { BotTransport } from '../../src/infra/bot-transport';
import type { TestApp } from './test-app';

/** Валидный нейтральный UUID (системный актор по умолчанию в e2e). */
const EMPTY_UUID = '00000000-0000-4000-8000-000000000000';

// ── Записи вызовов мок-Api ──

export interface SentMessage {
  telegramId: number;
  messageId: number;
  text: string;
  keyboard?: KeyboardDescription;
}

export interface EditedMessage {
  telegramId: number;
  messageId: number;
  text: string;
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
 *
 * Уровень Api = «что увидел Telegram»: сюда транспорт рендерит реплики
 * (с заголовком вида 🔔/ℹ️/⚠️ — единая таблица ФР-5) и экраны (со штампами
 * `:~<seq36>` в кодах кнопок). E2E-сценарии нажимают кнопки, взяв
 * отштампованный код из клавиатуры предыдущего экрана — как реальный клиент.
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
 * Тестовый подкласс U7BotUiApp: открывает сбор menuButtons (в проде меню
 * собирается только внутри welcome/short/help-экранов). Прод-API не
 * расширяет — метод открывается protected-членом подкласса.
 */
class ExposedMenuUiApp extends U7BotUiApp {
  collectMainMenu(actor: User) {
    return this.collectMenuButtons(actor);
  }
}

/**
 * Честный тестовый стенд: реальный BotTransport + мок-Api + реальная
 * сессионная мапа + реальный U7BotUiApp.
 *
 * DialogResponse захватывается на границе uiApp (обёртки handle*): транспорт
 * рендерит ответ сам, восстановление из Api-вызовов теряло бы notify/
 * awaitInput/release и путало реплику с экраном. Api-записи при этом
 * остаются доступными для проактивных сценариев (сообщения другим адресатам)
 * и для проверки штампов/ретира — «что увидел Telegram».
 */
export class TestBotTransport {
  readonly api = new RecordingBotApi();
  readonly uiApp: ExposedMenuUiApp;
  readonly transport: BotTransport;
  #lastResponse: DialogResponse | null = null;

  constructor(
    apiApp: U7BotApp,
    actorResolver: (tgId: number) => Promise<User>,
    controllers: U7BotController[],
    opts: {
      eventBus?: InProcEventBus;
      /** Фасад пользователей — гост-регистрация на /start (см. ensureRegisteredGuest). */
      userFacade?: U7BotUiAppResolve['userFacade'];
      /** Системный актор-бот: от его имени регистрируются гости. */
      botAdminUuid?: string;
    } = {},
  ) {
    this.uiApp = new ExposedMenuUiApp(controllers);
    this.transport = new BotTransport(this.uiApp, this.api as unknown as Api);
    this.uiApp.init(
      {
        // Общая с apiApp шина — события модулей (напр. questionnaire:start)
        // долетают до подписок стори (как в бою: create-ui-app + main.ts)
        eventBus: opts.eventBus ?? new InProcEventBus(),
        actorResolver,
        appApi: apiApp,
        userFacade:
          opts.userFacade ??
          ({
            // Гост-регистрация в e2e не тестируется (все акторы из фикстур);
            // заглушка сохраняет форму resolve, не пишя в хранилище.
            registerGuest: async () => undefined,
          } as unknown as U7BotUiAppResolve['userFacade']),
        botAdminUuid: opts.botAdminUuid ?? EMPTY_UUID,
      },
      this.transport,
    );
    // Подписки стори на доменные события (в бою вызывается в main.ts)
    this.uiApp.subscribeEvents();
    this.#captureResponses();
  }

  /** Сбрасывает накопленные сообщения и последний ответ (изоляция тестов). */
  reset(): void {
    this.api.reset();
    this.#lastResponse = null;
  }

  // ── Фабрика мок-контекста ──

  /**
   * Создаёт мок Grammy-контекста, привязанный к сессии из sessionMap.
   * Повторные вызовы для одного tgId возвращают одну и ту же сессию.
   */
  makeBotContext(
    tgId: number,
    opts: { callbackData?: string; text?: string } = {},
  ): BotContext {
    return {
      from: { id: tgId, first_name: 'Test', is_bot: false },
      chat: { id: tgId, type: 'private' },
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

  /** menuButtons актора (приоритеты, kind, action) — сбор реального uiApp. */
  collectMainMenu(actor: User) {
    return this.uiApp.collectMainMenu(actor);
  }

  // ── Обработчики (маршруты main.ts) ──

  /** /start — команда (в бою: transport.handleCommand, конверт парсится). */
  async handleStart(ctx: BotContext): Promise<DialogResponse> {
    return this.#command(ctx, '/start');
  }

  /** /help — команда. */
  async handleHelp(ctx: BotContext): Promise<DialogResponse> {
    return this.#command(ctx, '/help');
  }

  /** /cancel — команда. */
  async handleCancel(ctx: BotContext): Promise<DialogResponse> {
    return this.#command(ctx, '/cancel');
  }

  /** Произвольная слэш-команда текстом. */
  async handleCommand(ctx: BotContext, text: string): Promise<DialogResponse> {
    return this.#command(ctx, text);
  }

  /**
   * Нажатие кнопки. Код должен быть отштампован транспорт (:~seq36) —
   * берите его из клавиатуры предыдущего экрана (api.sentMessages /
   * .editedMessages), как это делает реальный клиент.
   */
  async handleCallback(ctx: BotContext): Promise<DialogResponse> {
    return this.#run(() => this.transport.handleCallback(ctx));
  }

  /** Текстовый ввод в ожидающий диалог (awaitInput). */
  async handleMessage(ctx: BotContext): Promise<DialogResponse> {
    return this.#run(() => this.transport.handleMessage(ctx));
  }

  // ── Внутреннее ──

  /** Команда: подставляет текст в конверт и идёт через transport.handleCommand. */
  async #command(ctx: BotContext, text: string): Promise<DialogResponse> {
    (ctx as { message: unknown }).message = { text };
    return this.#run(() => this.transport.handleCommand(ctx));
  }

  /**
   * Обёртки на экземпляре uiApp: транспорт вызывает uiApp.handle* —
   * перехватываем возвращённый DialogResponse (последний за #run).
   */
  #captureResponses(): void {
    const ui = this.uiApp as unknown as Record<
      string,
      (...args: never[]) => Promise<DialogResponse | null>
    >;
    for (const key of ['handleCommand', 'handleCallback', 'handleMessage']) {
      const original = ui[key]?.bind(this.uiApp);
      if (!original) continue;
      ui[key] = async (...args: never[]) => {
        const response = await original(...args);
        this.#lastResponse = response;
        return response;
      };
    }
  }

  /**
   * Запускает обработчик транспорта и возвращает DialogResponse,
   * захваченный на границе uiApp (полная форма: screen + notify +
   * awaitInput/release). {} — ответа не было (тихий пропуск).
   */
  async #run(fn: () => Promise<void>): Promise<DialogResponse> {
    this.#lastResponse = null;
    await fn();
    return this.#lastResponse ?? {};
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
    { eventBus: app.eventBus, userFacade: app.userFacade },
  );
}
