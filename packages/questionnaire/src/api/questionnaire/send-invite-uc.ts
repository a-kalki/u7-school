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
  protected readonly ucLabel = 'Отправить приглашение на анкету' as const;
  protected readonly arMeta = {
    arName: 'Questionnaire' as const,
    arLabel: 'Анкета' as const,
  };
  protected readonly type = 'command' as const;
  protected readonly requiresAuth = false as const;
  protected readonly inputSchema = SendInviteCmdSchema;
  protected readonly outputSchema = v.any();

  async execute(command: SendInviteCmd, actorId: string): Promise<undefined> {
    const user = await this.getUser(actorId);
    const ar = QuestionnaireAr.create(user.telegramId, command.pool);
    await this.repo.save(ar.state);

    const invite = ar.getInvite();
    await this.resolve.botFacade.sendQuestionnaireInvite(user, invite);
  }
}
