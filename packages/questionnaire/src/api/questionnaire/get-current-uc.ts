import type { GetCurrentCmdMeta } from '#domain/questionnaire/commands/get-current-cmd';
import {
  type GetCurrentCmd,
  GetCurrentCmdSchema,
} from '#domain/questionnaire/commands/get-current-cmd';
import { QuestionnaireAr } from '../../domain/questionnaire/a-root';
import type { QuestionnaireActionResponse } from '../../domain/questionnaire/types';
import { QuestionnaireActionResponseSchema } from '../../domain/questionnaire/types';
import { QuestionnaireUseCase } from './questionnaire-uc';

export class GetCurrentUc extends QuestionnaireUseCase<GetCurrentCmdMeta> {
  protected readonly ucName = 'get-current' as const;
  protected readonly ucLabel = 'Получить текущее состояние анкеты' as const;
  protected readonly arMeta = {
    arName: 'Questionnaire' as const,
    arLabel: 'Анкета' as const,
  };
  protected readonly type = 'query' as const;
  protected readonly requiresAuth = false as const;
  protected readonly inputSchema = GetCurrentCmdSchema;
  protected readonly outputSchema = QuestionnaireActionResponseSchema;

  async execute(
    command: GetCurrentCmd,
    _actorId: string,
  ): Promise<QuestionnaireActionResponse> {
    const state = await this.getQuestionnaire(command.questionnaireId);
    const ar = new QuestionnaireAr(state);
    return ar.getQuestionnaireActionResponse();
  }
}
