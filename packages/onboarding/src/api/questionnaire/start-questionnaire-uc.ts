import { errConflict } from '@u7/core/domain';
import { QuestionnaireAr } from '#domain/questionnaire/a-root';
import {
  type StartQuestionnaireCmd,
  type StartQuestionnaireCmdMeta,
  StartQuestionnaireCmdSchema,
} from '#domain/questionnaire/commands/start-questionnaire-cmd';
import type { Questionnaire } from '#domain/questionnaire/entity';
import { QuestionnaireSchema } from '#domain/questionnaire/entity';
import type { QuestionnaireActiveUcError } from '#domain/questionnaire/errors';
import { OnboardingUseCase } from '../onboarding-uc';

/**
 * Use-case начала анкеты.
 * Создаёт новую анкету для пользователя и возвращает её состояние.
 * Не требует авторизации — используется ботом.
 */
export class StartQuestionnaireUc extends OnboardingUseCase<StartQuestionnaireCmdMeta> {
  protected readonly ucName = 'start-questionnaire' as const;
  protected readonly ucLabel = 'Начать анкету' as const;
  protected readonly arMeta = {
    arName: 'Questionnaire' as const,
    arLabel: 'Анкета' as const,
  };
  protected readonly type = 'command' as const;
  /** Не требует авторизации — используется ботом */
  protected readonly requiresAuth = false as const;
  protected readonly inputSchema = StartQuestionnaireCmdSchema;
  protected readonly outputSchema = QuestionnaireSchema;

  async execute(command: StartQuestionnaireCmd): Promise<Questionnaire> {
    const existing = (await this.resolve.questionnaireRepo.getByTelegramId(
      command.telegramId,
    )) as any[];
    const hasActive = existing.some((q) => q.status === 'in_progress');
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

    return ar.state;
  }
}
