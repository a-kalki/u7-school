import {
  type GetQuestionnaireCmd,
  type GetQuestionnaireCmdMeta,
  GetQuestionnaireCmdSchema,
} from '#domain/questionnaire/commands/get-questionnaire-cmd';
import type { Questionnaire } from '#domain/questionnaire/entity';
import { QuestionnaireSchema } from '#domain/questionnaire/entity';
import { OnboardingUseCase } from '../onboarding-uc';

/**
 * Use-case получения анкеты по UUID.
 */
export class GetQuestionnaireUc extends OnboardingUseCase<GetQuestionnaireCmdMeta> {
  protected readonly ucName = 'get-questionnaire' as const;
  protected readonly ucLabel = 'Получить анкету' as const;
  protected readonly arMeta = {
    arName: 'Questionnaire' as const,
    arLabel: 'Анкета' as const,
  };
  protected readonly type = 'query' as const;
  protected readonly requiresAuth = false as const;
  protected readonly inputSchema = GetQuestionnaireCmdSchema;
  protected readonly outputSchema = QuestionnaireSchema;

  async execute(command: GetQuestionnaireCmd): Promise<Questionnaire> {
    const questionnaire = await this.getQuestionnaire(command.uuid);
    return questionnaire;
  }
}
