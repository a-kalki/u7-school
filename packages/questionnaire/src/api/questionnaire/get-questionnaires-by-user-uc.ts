import * as v from 'valibot';
import type { GetQuestionnairesByUserCmdMeta } from '#domain/questionnaire/commands/get-questionnaires-by-user-cmd';
import {
  type GetQuestionnairesByUserCmd,
  GetQuestionnairesByUserCmdSchema,
} from '#domain/questionnaire/commands/get-questionnaires-by-user-cmd';
import type { Questionnaire } from '../../domain/questionnaire/entity';
import { QuestionnaireSchema } from '../../domain/questionnaire/entity';
import { QuestionnaireUseCase } from '../questionnaire-uc';

export class GetQuestionnairesByUserUc extends QuestionnaireUseCase<GetQuestionnairesByUserCmdMeta> {
  protected readonly ucName = 'get-questionnaires-by-user' as const;
  protected readonly ucLabel = 'Получить анкеты пользователя' as const;
  protected readonly arMeta = {
    arName: 'Questionnaire' as const,
    arLabel: 'Анкета' as const,
  };
  protected readonly type = 'query' as const;
  protected readonly requiresAuth = true as const;
  protected readonly inputSchema = GetQuestionnairesByUserCmdSchema;
  protected readonly outputSchema = v.array(QuestionnaireSchema);

  async execute(
    command: GetQuestionnairesByUserCmd,
    actorId: string,
  ): Promise<Questionnaire[]> {
    const actor = await this.getUser(actorId);
    this.ensureCanListForUser(actor, command.userId);
    return this.repo.getByRespondentId(command.userId);
  }
}
