import type { TgFacade } from '@u7-scl/stream/domain';

/** Минимальный интерфейс Telegram API, достаточный для отправки сообщений */
export interface TgApi {
  sendMessage(chatId: number | string, text: string): Promise<unknown>;
}

/**
 * Реализация TgFacade через Telegram Bot API.
 */
export class TelegramTgFacade implements TgFacade {
  private api: TgApi;

  constructor(bot: { api: TgApi }) {
    this.api = bot.api;
  }

  async sendMessage(telegramId: number, text: string): Promise<void> {
    await this.api.sendMessage(telegramId, text);
  }

  async sendBatch(telegramIds: number[], text: string): Promise<void> {
    for (const id of telegramIds) {
      await this.api.sendMessage(id, text);
    }
  }
}
