import type { StartByInviteCmdMeta } from '#domain/questionnaire/commands/start-by-invite-cmd';
import {
  type StartByInviteCmd,
  StartByInviteCmdSchema,
} from '#domain/questionnaire/commands/start-by-invite-cmd';
import { QuestionnaireFactory } from '../../domain/questionnaire/questionnaire-factory';
import type { QuestionnaireActionResponse } from '../../domain/questionnaire/types';
import { QuestionnaireActionResponseSchema } from '../../domain/questionnaire/types';
import { QuestionnaireUseCase } from '../questionnaire-uc';

export class StartByInviteUc extends QuestionnaireUseCase<StartByInviteCmdMeta> {
  protected readonly ucName = 'start-by-invite' as const;
  protected readonly ucLabel = 'Запустить анкету по приглашению' as const;
  protected readonly arMeta = {
    arName: 'Questionnaire' as const,
    arLabel: 'Анкета' as const,
  };
  protected readonly type = 'command' as const;
  protected readonly requiresAuth = true as const;
  protected readonly inputSchema = StartByInviteCmdSchema;
  protected readonly outputSchema = QuestionnaireActionResponseSchema;

  async execute(
    command: StartByInviteCmd,
    actorId: string,
  ): Promise<QuestionnaireActionResponse> {
    const actor = await this.getUser(actorId);
    const state = await this.getQuestionnaireForEdit(
      command.questionnaireId,
      actor,
    );
    const ar = QuestionnaireFactory.restore(state);
    const response = ar.start();
    await this.repo.save(ar.state);
    return response;
  }
}
