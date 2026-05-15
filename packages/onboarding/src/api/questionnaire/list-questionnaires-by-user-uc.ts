import * as v from 'valibot';
import {
  type ListQuestionnairesByUserCmd,
  type ListQuestionnairesByUserCmdMeta,
  ListQuestionnairesByUserCmdSchema,
} from '#domain/questionnaire/commands/list-questionnaires-by-user-cmd';
import type { Questionnaire } from '#domain/questionnaire/entity';
import { QuestionnaireSchema } from '#domain/questionnaire/entity';
import { QuestionnairePolicy } from '#domain/questionnaire/policy';
import { OnboardingUseCase } from '../onboarding-uc';

/**
 * Use-case списка анкет пользователя.
 */
export class ListQuestionnairesByUserUc extends OnboardingUseCase<ListQuestionnairesByUserCmdMeta> {
  protected readonly ucName = 'list-questionnaires-by-user' as const;
  protected readonly ucLabel = 'Список анкет пользователя' as const;
  protected readonly arMeta = {
    arName: 'Questionnaire' as const,
    arLabel: 'Анкета' as const,
  };
  protected readonly type = 'query' as const;
  protected readonly requiresAuth = true as const;
  protected readonly inputSchema = ListQuestionnairesByUserCmdSchema;
  protected readonly outputSchema = v.array(QuestionnaireSchema);

  async execute(
    command: ListQuestionnairesByUserCmd,
    actorId: string,
  ): Promise<Questionnaire[]> {
    const actor = await this.getActor(actorId);

    // Проверяем, что актор либо сам пользователь, либо ADMIN/MENTOR
    if (actor.uuid !== command.userId && !QuestionnairePolicy.canList(actor)) {
      this.throwAccessDenied('Недостаточно прав для просмотра анкет');
    }

    return this.resolve.questionnaireRepo.getByUserId(command.userId);
  }
}
