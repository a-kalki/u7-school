import type { StreamController } from '@u7-scl/stream/src/ui/bot/controller/stream-controller';
import type { BotUpdate, BotResponse } from '@u7-scl/core/ui';

export class StreamHandler {
  readonly #controller: StreamController;

  constructor(controller: StreamController) {
    this.#controller = controller;
  }

  async handleUpdate(update: BotUpdate, botUuid: string): Promise<BotResponse> {
    // В onboarding используется update.telegramId в качестве actorId,
    // но в спецификации сказано, что actorId это userId (UUID).
    // Посмотрим onboarding-handler для примера.
    return this.#controller.handleUpdate(update, botUuid);
  }
}
