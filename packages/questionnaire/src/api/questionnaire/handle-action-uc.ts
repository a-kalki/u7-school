import type { HandleActionCmdMeta } from '#domain/questionnaire/commands/handle-action-cmd';
import {
  type HandleActionCmd,
  HandleActionCmdSchema,
} from '#domain/questionnaire/commands/handle-action-cmd';
import { QuestionnaireAr } from '../../domain/questionnaire/a-root';
import type { QuestionnaireActionResponse } from '../../domain/questionnaire/types';
import { QuestionnaireActionResponseSchema } from '../../domain/questionnaire/types';
import { QuestionnaireUseCase } from './questionnaire-uc';

export class HandleActionUc extends QuestionnaireUseCase<HandleActionCmdMeta> {
  protected readonly ucName = 'handle-action' as const;
  protected readonly ucLabel = 'Обработать действие в анкете' as const;
  protected readonly arMeta = {
    arName: 'Questionnaire' as const,
    arLabel: 'Анкета' as const,
  };
  protected readonly type = 'command' as const;
  protected readonly requiresAuth = false as const;
  protected readonly inputSchema = HandleActionCmdSchema;
  protected readonly outputSchema = QuestionnaireActionResponseSchema;

  async execute(
    command: HandleActionCmd,
    _actorId: string,
  ): Promise<QuestionnaireActionResponse> {
    const state = await this.getQuestionnaire(command.questionnaireId);
    const ar = new QuestionnaireAr(state);
    const response = ar.handleAction({
      type: command.type,
      value: command.value,
    });
    await this.repo.save(ar.state);
    return response;
  }
}
