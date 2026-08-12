import * as v from 'valibot';
import { QuestionnaireAr } from '../../domain/questionnaire/a-root';
import type { QuestionnaireActionResponse } from '../../domain/questionnaire/types';
import { QuestionnaireUseCase } from './questionnaire-uc';
import type { StartByInviteUcMeta } from './uc-metas';

const StartByInviteCmdSchema = v.object({
  questionnaireId: v.pipe(v.string(), v.uuid()),
});

export class StartByInviteUc extends QuestionnaireUseCase<StartByInviteUcMeta> {
  protected readonly ucName = 'start-by-invite' as const;
  protected readonly ucLabel = 'Запустить анкету по приглашению' as const;
  protected readonly arMeta = {
    arName: 'Questionnaire' as const,
    arLabel: 'Анкета' as const,
  };
  protected readonly type = 'command' as const;
  protected readonly requiresAuth = false as const;
  protected readonly inputSchema = StartByInviteCmdSchema;
  protected readonly outputSchema = v.any();

  async execute(
    command: { questionnaireId: string },
    _actorId: string,
  ): Promise<QuestionnaireActionResponse> {
    const state = await this.getQuestionnaire(command.questionnaireId);
    const ar = new QuestionnaireAr(state);
    const response = ar.start();
    await this.repo.save(ar.state);

    return response;
  }
}
