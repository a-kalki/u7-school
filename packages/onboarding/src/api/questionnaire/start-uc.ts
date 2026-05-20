import { errConflict } from '@u7-scl/core/domain';
import * as v from 'valibot';
import { QuestionnaireAr } from '#domain/questionnaire/a-root';
import {
  type StartQuestionnaireCmd,
  type StartQuestionnaireCmdMeta,
  StartQuestionnaireCmdSchema,
} from '#domain/questionnaire/commands/start-questionnaire-cmd';
import type { QuestionnaireActiveUcError } from '#domain/questionnaire/errors';
import type { QuestionnaireActionResponse } from '#domain/questionnaire/types';
import { OnboardingUseCase } from '../onboarding-uc';

/**
 * Use-case начала анкеты.
 * Создаёт новую анкету для пользователя и возвращает её состояние.
 * Не требует авторизации — используется ботом.
 */
export class StartUc extends OnboardingUseCase<StartQuestionnaireCmdMeta> {
  protected readonly ucName = 'start' as const;
  protected readonly ucLabel = 'Начать анкету' as const;
  protected readonly arMeta = {
    arName: 'Questionnaire' as const,
    arLabel: 'Анкета' as const,
  };
  protected readonly type = 'command' as const;
  protected readonly requiresAuth = false as const;
  protected readonly inputSchema = StartQuestionnaireCmdSchema;
  protected readonly outputSchema = v.any();

  async execute(
    command: StartQuestionnaireCmd,
    _actorId: string,
  ): Promise<QuestionnaireActionResponse> {
    const hasActive = !!(await this.getActiveQuestionnaire(command.telegramId));
    if (hasActive) {
      this.throwError(
        errConflict<QuestionnaireActiveUcError>(
          'QUESTIONNAIRE_ACTIVE',
          'У тебя уже есть активная анкета',
          { userId: String(command.telegramId) },
        ),
      );
    }

    const ar = QuestionnaireAr.start(
      command.telegramId,
      this.resolve.questionPoolService,
    );
    await this.resolve.questionnaireRepo.save(ar.state);

    return ar.getQuestionnaireActionResponse();
  }
}
