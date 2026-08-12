import type { StartByInviteCmdMeta } from '#domain/questionnaire/commands/start-by-invite-cmd';
import {
  type StartByInviteCmd,
  StartByInviteCmdSchema,
} from '#domain/questionnaire/commands/start-by-invite-cmd';
import { QuestionnaireAr } from '../../domain/questionnaire/a-root';
import type { QuestionnaireActionResponse } from '../../domain/questionnaire/types';
import { QuestionnaireActionResponseSchema } from '../../domain/questionnaire/types';
import { QuestionnaireUseCase } from './questionnaire-uc';

export class StartByInviteUc extends QuestionnaireUseCase<StartByInviteCmdMeta> {
  protected readonly ucName = 'start-by-invite' as const;
  protected readonly ucLabel = 'Запустить анкету по приглашению' as const;
  protected readonly arMeta = {
    arName: 'Questionnaire' as const,
    arLabel: 'Анкета' as const,
  };
  protected readonly type = 'command' as const;
  protected readonly requiresAuth = false as const;
  protected readonly inputSchema = StartByInviteCmdSchema;
  protected readonly outputSchema = QuestionnaireActionResponseSchema;

  async execute(
    command: StartByInviteCmd,
    _actorId: string,
  ): Promise<QuestionnaireActionResponse> {
    const state = await this.getQuestionnaire(command.questionnaireId);
    const ar = new QuestionnaireAr(state);
    const response = ar.start();
    await this.repo.save(ar.state);
    return response;
  }
}
