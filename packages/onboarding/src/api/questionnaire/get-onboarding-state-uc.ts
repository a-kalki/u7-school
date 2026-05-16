import { errNotFound } from '@u7/core/domain';
import type { QuestionnaireNotFoundUcError } from '#domain/index';
import {
  type GetOnboardingStateCmd,
  type GetOnboardingStateCmdMeta,
  GetOnboardingStateCmdSchema,
  type OnboardingState,
  OnboardingStateSchema,
} from '#domain/questionnaire/commands/get-onboarding-state-cmd';
import { OnboardingUseCase } from '../onboarding-uc';

/**
 * Use-case получения текущего состояния онбординга пользователя (stateless bot support).
 * Не требует авторизации — используется ботом.
 */
export class GetOnboardingStateUc extends OnboardingUseCase<GetOnboardingStateCmdMeta> {
  protected readonly ucName = 'get-onboarding-state' as const;
  protected readonly ucLabel = 'Получить состояние онбординга' as const;
  protected readonly arMeta = {
    arName: 'Questionnaire' as const,
    arLabel: 'Анкета' as const,
  };
  protected readonly type = 'query' as const;
  /** Не требует авторизации — используется ботом */
  protected readonly requiresAuth = false as const;
  protected readonly inputSchema = GetOnboardingStateCmdSchema;
  protected readonly outputSchema = OnboardingStateSchema;

  async execute(command: GetOnboardingStateCmd): Promise<OnboardingState> {
    const questionnaires = await this.resolve.questionnaireRepo.getByTelegramId(
      command.telegramId,
    );

    const active = questionnaires.find((q) => q.status === 'in_progress');

    if (!active) {
      const completedCount = questionnaires.filter(
        (q) => q.status === 'completed',
      ).length;
      return { status: 'none_active', completedCount };
    }

    if (!active.currentQuestionCode) {
      return { status: 'none_active', completedCount: 0 };
    }

    const question = this.resolve.questionPoolService.getByCode(
      active.currentQuestionCode,
    );

    if (!question) {
      this.throwError(
        errNotFound<QuestionnaireNotFoundUcError>(
          'QUESTIONNAIRE_NOT_FOUND',
          `Текущий вопрос ${active.currentQuestionCode} не найден в пуле`,
          { uuid: active.uuid },
        ),
      );
    }

    return {
      status: 'in_progress',
      questionnaireUuid: active.uuid,
      question,
      draftAnswers: active.draftAnswers ?? [],
    };
  }
}
