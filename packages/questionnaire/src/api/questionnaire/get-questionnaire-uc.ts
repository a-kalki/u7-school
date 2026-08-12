import type { GetQuestionnaireCmdMeta } from '#domain/questionnaire/commands/get-questionnaire-cmd';
import {
  type GetQuestionnaireCmd,
  GetQuestionnaireCmdSchema,
} from '#domain/questionnaire/commands/get-questionnaire-cmd';
import type { Questionnaire } from '../../domain/questionnaire/entity';
import { QuestionnaireSchema } from '../../domain/questionnaire/entity';
import { QuestionnaireUseCase } from '../questionnaire-uc';

export class GetQuestionnaireUc extends QuestionnaireUseCase<GetQuestionnaireCmdMeta> {
  protected readonly ucName = 'get-questionnaire' as const;
  protected readonly ucLabel = 'Получить анкету' as const;
  protected readonly arMeta = {
    arName: 'Questionnaire' as const,
    arLabel: 'Анкета' as const,
  };
  protected readonly type = 'query' as const;
  protected readonly requiresAuth = true as const;
  protected readonly inputSchema = GetQuestionnaireCmdSchema;
  protected readonly outputSchema = QuestionnaireSchema;

  async execute(
    command: GetQuestionnaireCmd,
    actorId: string,
  ): Promise<Questionnaire> {
    const actor = await this.getUser(actorId);
    return this.getQuestionnaireForRead(command.uuid, actor);
  }
}
