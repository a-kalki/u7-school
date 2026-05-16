import { QuestionnaireAr } from '#domain/questionnaire/a-root';
import {
  type ToggleDraftAnswerCmd,
  type ToggleDraftAnswerCmdMeta,
  ToggleDraftAnswerCmdSchema,
} from '#domain/questionnaire/commands/toggle-draft-answer-cmd';
import type { Questionnaire } from '#domain/questionnaire/entity';
import { QuestionnaireSchema } from '#domain/questionnaire/entity';
import { OnboardingUseCase } from '../onboarding-uc';

/**
 * Use-case переключения чернового ответа (добавление/удаление).
 */
export class ToggleDraftAnswerUc extends OnboardingUseCase<ToggleDraftAnswerCmdMeta> {
  protected readonly ucName = 'toggle-draft-answer' as const;
  protected readonly ucLabel = 'Переключить черновой ответ' as const;
  protected readonly arMeta = {
    arName: 'Questionnaire' as const,
    arLabel: 'Анкета' as const,
  };
  protected readonly type = 'command' as const;
  protected readonly requiresAuth = false as const;
  protected readonly inputSchema = ToggleDraftAnswerCmdSchema;
  protected readonly outputSchema = QuestionnaireSchema;

  async execute(command: ToggleDraftAnswerCmd): Promise<Questionnaire> {
    const questionnaire = await this.getQuestionnaire(
      command.questionnaireUuid,
    );

    const ar = new QuestionnaireAr(
      questionnaire,
      this.resolve.questionPoolService,
      this.resolve.includedQuestionCodes,
    );

    ar.toggleDraftAnswer(command.questionCode, command.answerCode);

    await this.resolve.questionnaireRepo.save(ar.state);

    return ar.state;
  }
}
