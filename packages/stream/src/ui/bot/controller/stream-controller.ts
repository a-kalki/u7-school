import type { BotResponse, BotUpdate } from '@u7-scl/core/ui';
import { BotController } from '@u7-scl/core/ui';
import type { StreamApiModule } from '#api/module';

export class StreamController extends BotController {
  readonly #api: StreamApiModule;

  constructor(api: StreamApiModule) {
    super();
    this.#api = api;
  }

  async handleUpdate(update: BotUpdate, actorId: string): Promise<BotResponse> {
    try {
      if (update.type === 'command') {
        return this.#handleCommand(update, actorId);
      }
      return { sendMessage: { text: 'Действие пока не поддерживается' } };
    } catch (err) {
      return this.handleError(err);
    }
  }

  async #handleCommand(
    update: BotUpdate & { type: 'command' },
    actorId: string,
  ): Promise<BotResponse> {
    switch (update.command) {
      case 'streams': {
        const streams = await this.#api.handle({
          name: 'list-streams',
          attrs: {},
          actorId,
        });
        return {
          sendMessage: {
            text: `Доступные потоки: ${JSON.stringify(streams)}`,
          },
        };
      }
      default:
        return {};
    }
  }
}
