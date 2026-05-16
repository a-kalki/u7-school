import { errValidation, throwError } from '@u7/core/domain';
import { Role } from '@u7/user/domain';
import * as v from 'valibot';
import { QuestionnaireAr } from '#domain/questionnaire/a-root';
import {
  type HandleOnboardingActionCmd,
  type HandleOnboardingActionCmdMeta,
  HandleOnboardingActionCmdSchema,
} from '#domain/questionnaire/commands/handle-onboarding-action-cmd';
import type { QuestionnaireActionResponse } from '#domain/questionnaire/types';
import { OnboardingUseCase } from '../onboarding-uc';

/**
 * Универсальный use-case для обработки действий пользователя в анкете.
 * Инкапсулирует вызов агрегата и автоматическую выдачу ролей по завершении.
 * Не требует авторизации — используется ботом.
 */
export class HandleOnboardingActionUc extends OnboardingUseCase<HandleOnboardingActionCmdMeta> {
  protected readonly ucName = 'handle-onboarding-action' as const;
  protected readonly ucLabel = 'Обработать действие в анкете' as const;
  protected readonly arMeta = {
    arName: 'Questionnaire' as const,
    arLabel: 'Анкета' as const,
  };
  protected readonly type = 'command' as const;
  /** Не требует авторизации — используется ботом */
  protected readonly requiresAuth = false as const;
  protected readonly inputSchema = HandleOnboardingActionCmdSchema;
  protected readonly outputSchema = v.any();

  async execute(
    command: HandleOnboardingActionCmd,
    actorId: string,
  ): Promise<QuestionnaireActionResponse> {
    const { telegramId, questionCode, value } = command;

    // 1. Ищем активную анкету
    const existing =
      await this.resolve.questionnaireRepo.getByTelegramId(telegramId);
    const active = existing.find((q) => q.status === 'in_progress');

    if (!active) {
      throwError(
        errValidation('QUESTIONNAIRE_NOT_FOUND', 'У тебя нет активной анкеты', {
          telegramId: String(telegramId),
        }),
      );
    }

    const ar = new QuestionnaireAr(active, this.resolve.questionPoolService);

    // 2. Обрабатываем действие
    const response = ar.handleAction(questionCode, value);

    // 3. Сохраняем результат
    await this.resolve.questionnaireRepo.save(ar.state);

    // 4. Если анкета завершена — выдаем роль CANDIDATE
    if (response.type === 'completed') {
      try {
        const user = await this.resolve.userFacade.getUserByTelegramId(
          telegramId,
          actorId,
        );

        if (user) {
          await this.resolve.userFacade.addRoleToUser(
            user.uuid,
            Role.CANDIDATE,
            actorId,
          );
        }
      } catch (e) {
        console.error('Failed to grant CANDIDATE role after onboarding:', e);
      }
    }

    return response;
  }
}
