import type { User } from '@u7-scl/app/domain';
import type { ApiApp } from '@u7-scl/core/api';
import { validateMarkdownV2 } from '@u7-scl/core/shared';
import type { BotResponse, SendMessageDescription } from '@u7-scl/core/ui';
import { UiApp } from '@u7-scl/core/ui';
import { type Api, InlineKeyboard } from 'grammy';
import type { SessionData } from '../context';
import type { U7BotAppMeta } from './u7-bot-app-meta';

/**
 * Оркестратор UI приложения U7 Bot.
 *
 * Наследует всю маршрутизацию от UiApp из core.
 * Закрывает дженерики: TAppMeta = U7BotAppMeta, TActor = User.
 */
export class U7BotUiApp extends UiApp<U7BotAppMeta, User> {
  private botApi: Api | null = null;
  private sessionStore: {
    read: (telegramId: number) => Promise<SessionData>;
    write: (telegramId: number, session: SessionData) => Promise<void>;
  } | null = null;

  override init(apiApp: ApiApp<U7BotAppMeta>): void {
    super.init(apiApp);
  }

  /** Устанавливает транспорт для send(): Grammy API и хранилище сессий */
  setTgTransport(
    botApi: Api,
    sessionStore: {
      read: (telegramId: number) => Promise<SessionData>;
      write: (telegramId: number, session: SessionData) => Promise<void>;
    },
  ): void {
    this.botApi = botApi;
    this.sessionStore = sessionStore;
  }

  /**
   * Отправляет сообщение пользователю по telegramId.
   * Используется фасадами для инициативной отправки.
   *
   * @param telegramId — Telegram ID получателя
   * @param response — BotResponse с описанием сообщений и/или captureInput/releaseInput
   */
  async send(telegramId: number, response: BotResponse): Promise<void> {
    if (!this.botApi || !this.sessionStore) {
      throw new Error('U7BotUiApp.send: транспорт не настроен');
    }

    // 1. Сжимаем id в кнопках
    const toSend = this.compressResponse(response);

    // 2. Управляем сессией
    const session = await this.sessionStore.read(telegramId);

    if (toSend.captureInput) {
      session.activeHandler = {
        path: toSend.captureInput.path,
        context: toSend.captureInput.context,
        expiresAt: toSend.captureInput.ttlSeconds
          ? Date.now() + toSend.captureInput.ttlSeconds * 1000
          : undefined,
      };
    }

    if (toSend.releaseInput) {
      session.activeHandler = null;
    }

    // 3. Отправляем сообщения через Grammy API
    const api = this.botApi;
    const toSendMsgs =
      toSend.sendMessages ?? (toSend.sendMessage ? [toSend.sendMessage] : []);

    for (const msg of toSendMsgs) {
      await this.#sendOneMessage(api, telegramId, msg);
    }

    // 4. Редактируем предыдущее, если нужно
    if (toSend.editMessage && session.lastBotMessage?.messageId) {
      await this.#editMessage(
        api,
        telegramId,
        session.lastBotMessage.messageId,
        toSend.editMessage,
      );
    }

    // 5. Сохраняем сессию
    await this.sessionStore.write(telegramId, session);
  }

  async #sendOneMessage(
    api: Api,
    telegramId: number,
    msg: SendMessageDescription,
  ): Promise<void> {
    const keyboard = msg.keyboard
      ? new InlineKeyboard(
          msg.keyboard.rows.map((row) =>
            row.map((btn) =>
              btn.url
                ? { text: btn.text, url: btn.url }
                : { text: btn.text, callback_data: btn.code },
            ),
          ),
        )
      : undefined;

    if (msg.parseMode === 'MarkdownV2' && msg.text) {
      const result = validateMarkdownV2(msg.text);
      if (!result.valid) {
        console.warn(
          `[MarkdownV2] ${result.issues.length} issue(s) in send():`,
          result.issues.map((i) => i.char).join(', '),
        );
      }
    }

    await api.sendMessage(telegramId, msg.text, {
      reply_markup: keyboard,
      parse_mode: msg.parseMode,
    });
  }

  async #editMessage(
    api: Api,
    telegramId: number,
    messageId: number,
    msg: SendMessageDescription,
  ): Promise<void> {
    const keyboard = msg.keyboard
      ? new InlineKeyboard(
          msg.keyboard.rows.map((row) =>
            row.map((btn) =>
              btn.url
                ? { text: btn.text, url: btn.url }
                : { text: btn.text, callback_data: btn.code },
            ),
          ),
        )
      : undefined;

    await api.editMessageText(telegramId, messageId, msg.text, {
      reply_markup: keyboard,
      parse_mode: msg.parseMode,
    });
  }
}
