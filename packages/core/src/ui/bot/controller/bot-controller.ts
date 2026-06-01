import type { BotResponse, BotUpdate } from './types';

/**
 * Базовый контроллер для Telegram-бота.
 * Содержит общую логику обработки обновлений и рендеринга.
 */
export abstract class BotController {
  abstract handleUpdate(
    update: BotUpdate,
    actorId: string,
  ): Promise<BotResponse>;

  protected escapeMarkdown(text: string): string {
    return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
  }

  protected handleError(err: unknown): BotResponse {
    const message = err instanceof Error ? err.message : 'Неизвестная ошибка';
    return {
      sendMessage: {
        text: `⚠️ Произошла ошибка: ${this.escapeMarkdown(message)}`,
        parseMode: 'MarkdownV2',
      },
    };
  }
}
