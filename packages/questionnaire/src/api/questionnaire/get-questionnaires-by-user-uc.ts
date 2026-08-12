import * as v from 'valibot';
import type { GetQuestionnairesByUserCmdMeta } from '#domain/questionnaire/commands/get-questionnaires-by-user-cmd';
import {
  type GetQuestionnairesByUserCmd,
  GetQuestionnairesByUserCmdSchema,
} from '#domain/questionnaire/commands/get-questionnaires-by-user-cmd';
import type { Questionnaire } from '../../domain/questionnaire/entity';
import { QuestionnaireUseCase } from './questionnaire-uc';

export class GetQuestionnairesByUserUc extends QuestionnaireUseCase<GetQuestionnairesByUserCmdMeta> {
  protected readonly ucName = 'get-questionnaires-by-user' as const;
  protected readonly ucLabel = 'Получить анкеты пользователя' as const;
  protected readonly arMeta = {
    arName: 'Questionnaire' as const,
    arLabel: 'Анкета' as const,
  };
  protected readonly type = 'query' as const;
  protected readonly requiresAuth = false as const;
  protected readonly inputSchema = GetQuestionnairesByUserCmdSchema;
  protected readonly outputSchema = v.any();

  async execute(
    command: GetQuestionnairesByUserCmd,
    _actorId: string,
  ): Promise<Questionnaire[]> {
    return this.repo.getByRespondentId(command.userId);
  }
}
