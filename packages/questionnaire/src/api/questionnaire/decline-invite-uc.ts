import * as v from 'valibot';
import type { DeclineInviteCmdMeta } from '#domain/questionnaire/commands/decline-invite-cmd';
import {
  type DeclineInviteCmd,
  DeclineInviteCmdSchema,
} from '#domain/questionnaire/commands/decline-invite-cmd';
import { QuestionnaireAr } from '../../domain/questionnaire/a-root';
import { QuestionnaireUseCase } from '../questionnaire-uc';

const DeclineOutputSchema = v.object({
  cancelWarning: v.optional(v.string()),
});

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
  protected readonly outputSchema = DeclineOutputSchema;

  async execute(
    command: DeclineInviteCmd,
    actorId: string,
  ): Promise<{ cancelWarning?: string }> {
    const actor = await this.getUser(actorId);
    const state = await this.getQuestionnaireForEdit(
      command.questionnaireId,
      actor,
    );
    const ar = new QuestionnaireAr(state);
    ar.decline();
    await this.repo.save(ar.state);

    const pool = state.questionPool;
    return { cancelWarning: pool.cancelWarning };
  }
}
