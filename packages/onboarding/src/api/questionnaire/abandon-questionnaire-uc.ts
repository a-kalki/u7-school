import { QuestionnaireAr } from '#domain/questionnaire/a-root';
import {
  type AbandonQuestionnaireCmd,
  type AbandonQuestionnaireCmdMeta,
  AbandonQuestionnaireCmdSchema,
} from '#domain/questionnaire/commands/abandon-questionnaire-cmd';
import type { Questionnaire } from '#domain/questionnaire/entity';
import { QuestionnaireSchema } from '#domain/questionnaire/entity';
import { OnboardingUseCase } from '../onboarding-uc';

/**
 * Use-case прерывания анкеты.
 * Не требует авторизации — используется ботом.
 */
export class AbandonQuestionnaireUc extends OnboardingUseCase<AbandonQuestionnaireCmdMeta> {
  protected readonly ucName = 'abandon-questionnaire' as const;
  protected readonly ucLabel = 'Прервать анкету' as const;
  protected readonly arMeta = {
    arName: 'Questionnaire' as const,
    arLabel: 'Анкета' as const,
  };
  protected readonly type = 'command' as const;
  /** Не требует авторизации — используется ботом */
  protected readonly requiresAuth = false as const;
  protected readonly inputSchema = AbandonQuestionnaireCmdSchema;
  protected readonly outputSchema = QuestionnaireSchema;

  async execute(command: AbandonQuestionnaireCmd): Promise<Questionnaire> {
    const questionnaire = await this.getQuestionnaire(command.uuid);

    const ar = new QuestionnaireAr(
      questionnaire,
      this.resolve.questionPoolService,
    );
    ar.abandon();

    await this.resolve.questionnaireRepo.save(ar.state);

    return ar.state;
  }
}
