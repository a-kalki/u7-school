import type { BotResponse, BotUpdate } from '../types';
import type { OnboardingController } from './onboarding-controller';

/**
 * Безопасная обёртка над controller.handleUpdate.
 * Гарантирует, что исключение не просочится наружу — всегда возвращает BotResponse.
 *
 * Используется ботом (u7-bot) при всех вызовах контроллера,
 * чтобы падение контроллера не обрушило процесс бота.
 */
export async function safeHandleUpdate(
  controller: OnboardingController,
  update: BotUpdate,
  botUuid: string,
): Promise<BotResponse> {
  try {
    return await controller.handleUpdate(update, botUuid);
  } catch (err) {
    console.error('Необработанная ошибка в OnboardingController:', err);
    const message = err instanceof Error ? err.message : 'Неизвестная ошибка';
    return {
      sendMessage: { text: `⚠️ Произошла ошибка: ${message}` },
    };
  }
}
