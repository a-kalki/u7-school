import type { User } from '@u7-scl/user/domain';
import * as v from 'valibot';
import { QuestionnaireAr } from '../../domain/questionnaire/a-root';
import type { QuestionnairePool } from '../../domain/questionnaire/question';
import { QuestionnairePoolSchema } from '../../domain/questionnaire/question';
import { QuestionnaireUseCase } from './questionnaire-uc';
import type { SendInviteUcMeta } from './uc-metas';

const SendInviteCmdSchema = v.object({
  user: v.any(),
  pool: QuestionnairePoolSchema,
});

export class SendInviteUc extends QuestionnaireUseCase<SendInviteUcMeta> {
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

  async execute(
    command: { user: User; pool: QuestionnairePool },
    _actorId: string,
  ): Promise<undefined> {
    const ar = QuestionnaireAr.create(command.user.telegramId, command.pool);
    await this.repo.save(ar.state);

    const invite = ar.createInvite();
    await this.resolve.botFacade.sendQuestionnaireInvite(command.user, invite);
  }
}
