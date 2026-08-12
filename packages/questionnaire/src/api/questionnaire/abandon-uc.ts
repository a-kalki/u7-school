import * as v from 'valibot';
import type { AbandonCmdMeta } from '#domain/questionnaire/commands/abandon-cmd';
import {
  type AbandonCmd,
  AbandonCmdSchema,
} from '#domain/questionnaire/commands/abandon-cmd';
import { QuestionnaireAr } from '../../domain/questionnaire/a-root';
import { QuestionnaireUseCase } from './questionnaire-uc';

export class AbandonUc extends QuestionnaireUseCase<AbandonCmdMeta> {
  protected readonly ucName = 'abandon' as const;
  protected readonly ucLabel = 'Прервать анкету' as const;
  protected readonly arMeta = {
    arName: 'Questionnaire' as const,
    arLabel: 'Анкета' as const,
  };
  protected readonly type = 'command' as const;
  protected readonly requiresAuth = false as const;
  protected readonly inputSchema = AbandonCmdSchema;
  protected readonly outputSchema = v.undefined();

  async execute(command: AbandonCmd, _actorId: string): Promise<undefined> {
    const state = await this.getQuestionnaire(command.questionnaireId);
    const ar = new QuestionnaireAr(state);
    ar.abandon();
    await this.repo.save(ar.state);
    return undefined;
  }
}
