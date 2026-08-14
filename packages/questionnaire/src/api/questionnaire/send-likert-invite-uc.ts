import * as v from 'valibot';
import type { SendLikertInviteCmdMeta } from '../../domain/questionnaire/commands/send-likert-invite-cmd';
import {
  type SendLikertInviteCmd,
  SendLikertInviteCmdSchema,
} from '../../domain/questionnaire/commands/send-likert-invite-cmd';
import { QuestionnaireFactory } from '../../domain/questionnaire/questionnaire-factory';
import { QuestionnaireUseCase } from '../questionnaire-uc';

export class SendLikertInviteUc extends QuestionnaireUseCase<SendLikertInviteCmdMeta> {
  protected readonly ucName = 'send-likert-invite' as const;
  protected readonly ucLabel = 'Пригласить на likert-анкету' as const;
  protected readonly arMeta = {
    arName: 'Questionnaire' as const,
    arLabel: 'Анкета' as const,
  };
  protected readonly type = 'command' as const;
  protected readonly requiresAuth = true as const;
  protected readonly inputSchema = SendLikertInviteCmdSchema;
  protected readonly outputSchema = v.undefined();

  async execute(
    command: SendLikertInviteCmd,
    actorId: string,
  ): Promise<undefined> {
    const user = await this.getUser(actorId);
    const ar = QuestionnaireFactory.createLikert(
      user.uuid,
      command.pool,
      command.ownerInfo,
    );
    await this.repo.save(ar.state);
    const response = ar.getInvite();
    await this.botFacade.sendQuestionnaireInvite(user, response);
    return undefined;
  }
}
