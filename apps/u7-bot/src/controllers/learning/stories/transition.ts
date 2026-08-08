import type { User } from '@u7-scl/app/domain';
import { U7BotUserStory } from '@u7-scl/bot/u7-bot-user-story';
import type { BotResponse, BotUpdate, SessionData } from '@u7-scl/core/ui';

/**
 * Завершение урока/проекта/потока (S05c).
 *
 * Основная логика перехода (форматирование сообщений) вынесена
 * в shared.ts и используется сторей step-view при обработке complete-step.
 * Эта стори — точка входа для прямых вызовов переходов.
 */
export class TransitionStory extends U7BotUserStory {
  readonly name = 'transition';

  async handleCallback(
    action: string,
    _actor: User,
    _session: SessionData,
  ): Promise<BotResponse> {
    if (action.startsWith('announce:')) {
      // Прямые вызовы обрабатываются через step-view
      return {
        sendMessage: { text: '⚠️ Используйте кнопку «Продолжить учёбу»' },
      };
    }
    return { sendMessage: { text: '⚠️ Неизвестная команда' } };
  }

  override async handleMessage(
    _update: BotUpdate,
    _actor: User,
    _session: SessionData,
  ): Promise<BotResponse> {
    return { sendMessage: { text: '⚠️ Неизвестное сообщение' } };
  }
}
