import * as v from 'valibot';
import type { DeclineInviteCmdMeta } from '#domain/questionnaire/commands/decline-invite-cmd';
import {
  type DeclineInviteCmd,
  DeclineInviteCmdSchema,
} from '#domain/questionnaire/commands/decline-invite-cmd';
import { QuestionnaireFactory } from '../../domain/questionnaire/questionnaire-factory';
import { QuestionnaireUseCase } from '../questionnaire-uc';

export class DeclineInviteUc extends QuestionnaireUseCase<DeclineInviteCmdMeta> {
  protected readonly ucName = 'decline-invite' as const;
  protected readonly ucLabel = 'Отказаться от приглашения на анкету' as const;
  protected readonly arMeta = {
    arName: 'Questionnaire' as const,
    arLabel: 'Анкета' as const,
  };
  protected readonly type = 'command' as const;
  protected readonly requiresAuth = true as const;
  protected readonly inputSchema = DeclineInviteCmdSchema;
  protected readonly outputSchema = v.undefined();

  async execute(
    command: DeclineInviteCmd,
    actorId: string,
  ): Promise<undefined> {
    const actor = await this.getUser(actorId);
    const state = await this.getQuestionnaireForEdit(
      command.questionnaireId,
      actor,
    );
    const ar = QuestionnaireFactory.restore(state);
    ar.decline();
    await this.repo.save(ar.state);
    this.publishEvents(ar);
    return undefined;
  }
}
