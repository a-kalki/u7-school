import * as v from 'valibot';
import type { Questionnaire } from '../../domain/questionnaire/entity';
import { QuestionnaireUseCase } from './questionnaire-uc';
import type { GetQuestionnairesByUserUcMeta } from './uc-metas';

const GetByUserCmdSchema = v.object({
  userId: v.pipe(v.number(), v.minValue(1)),
});

export class GetQuestionnairesByUserUc extends QuestionnaireUseCase<GetQuestionnairesByUserUcMeta> {
  protected readonly ucName = 'get-questionnaires-by-user' as const;
  protected readonly ucLabel = 'Получить анкеты пользователя' as const;
  protected readonly arMeta = {
    arName: 'Questionnaire' as const,
    arLabel: 'Анкета' as const,
  };
  protected readonly type = 'query' as const;
  protected readonly requiresAuth = false as const;
  protected readonly inputSchema = GetByUserCmdSchema;
  protected readonly outputSchema = v.any();

  async execute(
    command: { userId: number },
    _actorId: string,
  ): Promise<Questionnaire[]> {
    return this.repo.getByRespondentId(command.userId);
  }
}
