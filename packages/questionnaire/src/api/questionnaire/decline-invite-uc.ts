import * as v from 'valibot';
import { QuestionnaireAr } from '../../domain/questionnaire/a-root';
import type { QuestionnairePool } from '../../domain/questionnaire/question';
import { QuestionnaireUseCase } from './questionnaire-uc';
import type { DeclineInviteUcMeta } from './uc-metas';

const DeclineInviteCmdSchema = v.object({
  questionnaireId: v.pipe(v.string(), v.uuid()),
});

export class DeclineInviteUc extends QuestionnaireUseCase<DeclineInviteUcMeta> {
  protected readonly ucName = 'decline-invite' as const;
  protected readonly ucLabel = 'Отказаться от приглашения на анкету' as const;
  protected readonly arMeta = {
    arName: 'Questionnaire' as const,
    arLabel: 'Анкета' as const,
  };
  protected readonly type = 'command' as const;
  protected readonly requiresAuth = false as const;
  protected readonly inputSchema = DeclineInviteCmdSchema;
  protected readonly outputSchema = v.object({
    cancelWarning: v.optional(v.string()),
  });

  async execute(
    command: { questionnaireId: string },
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
