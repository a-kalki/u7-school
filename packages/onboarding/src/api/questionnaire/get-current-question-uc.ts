import { errNotFound } from '@u7/core/domain';
import * as v from 'valibot';
import { QuestionnaireAr } from '#domain/questionnaire/a-root';
import {
  type GetCurrentQuestionCmd,
  type GetCurrentQuestionCmdMeta,
  GetCurrentQuestionCmdSchema,
} from '#domain/questionnaire/commands/get-current-question-cmd';
import type { QuestionnaireNotFoundUcError } from '#domain/questionnaire/errors';
import type { QuestionnaireActionResponse } from '#domain/questionnaire/types';
import { OnboardingUseCase } from '../onboarding-uc';

/**
 * Use-case получения текущего вопроса активной анкеты.
 * Возвращает текущий вопрос, черновики и статус анкеты.
 * Если активной анкеты нет — выбрасывает QUESTIONNAIRE_NOT_FOUND.
 * Не требует авторизации — используется ботом.
 */
export class GetCurrentQuestionUc extends OnboardingUseCase<GetCurrentQuestionCmdMeta> {
  protected readonly ucName = 'get-current-question' as const;
  protected readonly ucLabel = 'Получить текущий вопрос' as const;
  protected readonly arMeta = {
    arName: 'Questionnaire' as const,
    arLabel: 'Анкета' as const,
  };
  protected readonly type = 'query' as const;
  protected readonly requiresAuth = false as const;
  protected readonly inputSchema = GetCurrentQuestionCmdSchema;
  protected readonly outputSchema = v.any();

  async execute(
    command: GetCurrentQuestionCmd,
    _actorId: string,
  ): Promise<QuestionnaireActionResponse> {
    const active = await this.getActiveQuestionnaire(command.telegramId);
    if (!active) {
      this.throwError(
        errNotFound<QuestionnaireNotFoundUcError>(
          'QUESTIONNAIRE_NOT_FOUND',
          'У тебя нет активной анкеты',
          { uuid: '' },
        ),
      );
    }

    const ar = new QuestionnaireAr(active, this.resolve.questionPoolService);
    return ar.getQuestionnaireActionResponse();
  }
}
