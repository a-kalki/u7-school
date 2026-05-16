import * as v from 'valibot';
import {
  type ListQuestionnairesByTelegramIdCmd,
  type ListQuestionnairesByTelegramIdCmdMeta,
  ListQuestionnairesByTelegramIdCmdSchema,
} from '#domain/questionnaire/commands/list-questionnaires-by-telegram-id-cmd';
import type { Questionnaire } from '#domain/questionnaire/entity';
import { QuestionnaireSchema } from '#domain/questionnaire/entity';
import { OnboardingUseCase } from '../onboarding-uc';

/**
 * Use-case списка анкет пользователя.
 */
export class ListQuestionnairesByTelegramIdUc extends OnboardingUseCase<ListQuestionnairesByTelegramIdCmdMeta> {
  protected readonly ucName = 'list-questionnaires-by-telegram-id' as const;
  protected readonly ucLabel = 'Список анкет пользователя' as const;
  protected readonly arMeta = {
    arName: 'Questionnaire' as const,
    arLabel: 'Анкета' as const,
  };
  protected readonly type = 'query' as const;
  protected readonly requiresAuth = false as const;
  protected readonly inputSchema = ListQuestionnairesByTelegramIdCmdSchema;
  protected readonly outputSchema = v.array(QuestionnaireSchema);

  async execute(
    command: ListQuestionnairesByTelegramIdCmd,
  ): Promise<Questionnaire[]> {
    return this.resolve.questionnaireRepo.getByTelegramId(command.telegramId);
  }
}
