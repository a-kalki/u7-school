import * as v from 'valibot';
import { QuestionnaireAr } from '../../domain/questionnaire/a-root';
import type { QuestionnaireActionResponse } from '../../domain/questionnaire/types';
import { QuestionnaireUseCase } from './questionnaire-uc';
import type { GetCurrentUcMeta } from './uc-metas';

const GetCurrentCmdSchema = v.object({
  questionnaireId: v.pipe(v.string(), v.uuid()),
});

export class GetCurrentUc extends QuestionnaireUseCase<GetCurrentUcMeta> {
  protected readonly ucName = 'get-current' as const;
  protected readonly ucLabel = 'Получить текущее состояние анкеты' as const;
  protected readonly arMeta = {
    arName: 'Questionnaire' as const,
    arLabel: 'Анкета' as const,
  };
  protected readonly type = 'query' as const;
  protected readonly requiresAuth = false as const;
  protected readonly inputSchema = GetCurrentCmdSchema;
  protected readonly outputSchema = v.any();

  async execute(
    command: { questionnaireId: string },
    _actorId: string,
  ): Promise<QuestionnaireActionResponse> {
    const state = await this.getQuestionnaire(command.questionnaireId);
    const ar = new QuestionnaireAr(state);
    return ar.getQuestionnaireActionResponse();
  }
}
