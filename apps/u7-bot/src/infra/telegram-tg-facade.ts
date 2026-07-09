import type { TgFacade } from '@u7-scl/stream/domain';
import type { Api } from 'grammy';

/**
 * Реализация TgFacade через Grammy Bot API.
 */
export class TelegramTgFacade implements TgFacade {
  private api: Api;

  constructor(bot: { api: Api }) {
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
