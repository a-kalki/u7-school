import * as v from 'valibot';
import type { DeclineInviteCmdMeta } from '#domain/questionnaire/commands/decline-invite-cmd';
import {
  type DeclineInviteCmd,
  DeclineInviteCmdSchema,
} from '#domain/questionnaire/commands/decline-invite-cmd';
import { QuestionnaireAr } from '../../domain/questionnaire/a-root';
import type { QuestionnairePool } from '../../domain/questionnaire/question';
import { QuestionnaireUseCase } from './questionnaire-uc';

export class DeclineInviteUc extends QuestionnaireUseCase<DeclineInviteCmdMeta> {
  protected readonly ucName = 'decline-invite' as const;
  protected readonly ucLabel = 'Отказаться от приглашения на анкету' as const;
  protected readonly arMeta = {
    arName: 'Questionnaire' as const,
    arLabel: 'Анкета' as const,
  };
  protected readonly type = 'command' as const;
  protected readonly requiresAuth = false as const;
  protected readonly inputSchema = DeclineInviteCmdSchema;
  protected readonly outputSchema = v.any();

  async execute(
    command: DeclineInviteCmd,
    _actorId: string,
  ): Promise<{ cancelWarning?: string }> {
    const state = await this.getQuestionnaire(command.questionnaireId);
    const ar = new QuestionnaireAr(state);
    ar.decline();
    await this.repo.save(ar.state);

    const pool = state.questionPool as unknown as QuestionnairePool;
    return { cancelWarning: pool.cancelWarning };
  }
}
