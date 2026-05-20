import { errValidation, throwError } from '@u7-scl/core/domain';
import * as v from 'valibot';
import { QuestionnaireAr } from '#domain/questionnaire/a-root';
import {
  type AbandonQuestionnaireCmd,
  type AbandonQuestionnaireCmdMeta,
  AbandonQuestionnaireCmdSchema,
} from '#domain/questionnaire/commands/abandon-questionnaire-cmd';
import type { QuestionnaireActionResponse } from '#domain/questionnaire/types';
import { OnboardingUseCase } from '../onboarding-uc';

/**
 * Use-case прерывания анкеты.
 * Принимает telegramId, ищет активную анкету и завершает её.
 * Не требует авторизации — используется ботом.
 */
export class AbandonUc extends OnboardingUseCase<AbandonQuestionnaireCmdMeta> {
  protected readonly ucName = 'abandon' as const;
  protected readonly ucLabel = 'Прервать анкету' as const;
  protected readonly arMeta = {
    arName: 'Questionnaire' as const,
    arLabel: 'Анкета' as const,
  };
  protected readonly type = 'command' as const;
  protected readonly requiresAuth = false as const;
  protected readonly inputSchema = AbandonQuestionnaireCmdSchema;
  protected readonly outputSchema = v.any();

  async execute(
    command: AbandonQuestionnaireCmd,
    _actorId: string,
  ): Promise<QuestionnaireActionResponse> {
    const existing = await this.resolve.questionnaireRepo.getByTelegramId(
      command.telegramId,
    );
    const active = existing.find((q) => q.status === 'in_progress');

    if (!active) {
      throwError(
        errValidation('BAD_REQUEST', 'У тебя нет активной анкеты', {
          telegramId: String(command.telegramId),
        }),
      );
    }

    const ar = new QuestionnaireAr(active, this.resolve.questionPoolService);
    ar.abandon();

    await this.resolve.questionnaireRepo.save(ar.state);

    return { type: 'completed' as const };
  }
}
