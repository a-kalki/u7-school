import * as v from 'valibot';
import type { SendInviteCmdMeta } from '#domain/questionnaire/commands/send-invite-cmd';
import {
  type SendInviteCmd,
  SendInviteCmdSchema,
} from '#domain/questionnaire/commands/send-invite-cmd';
import { QuestionnaireAr } from '../../domain/questionnaire/a-root';
import { QuestionnaireUseCase } from './questionnaire-uc';

export class SendInviteUc extends QuestionnaireUseCase<SendInviteCmdMeta> {
  protected readonly ucName = 'send-invite' as const;
  protected readonly ucLabel = 'Пригласить на анкету' as const;
  protected readonly arMeta = {
    arName: 'Questionnaire' as const,
    arLabel: 'Анкета' as const,
  };
  protected readonly type = 'command' as const;
  protected readonly requiresAuth = true as const;
  protected readonly inputSchema = SendInviteCmdSchema;
  protected readonly outputSchema = v.undefined();

  async execute(command: SendInviteCmd, actorId: string): Promise<undefined> {
    const user = await this.getUser(actorId);
    const ar = QuestionnaireAr.create(user.uuid, command.pool);
    await this.repo.save(ar.state);
    const response = ar.getInvite();
    await this.botFacade.sendQuestionnaireInvite(user, response);
    return undefined;
  }
}
