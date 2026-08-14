import * as v from 'valibot';
import type { AbandonCmdMeta } from '#domain/questionnaire/commands/abandon-cmd';
import {
  type AbandonCmd,
  AbandonCmdSchema,
} from '#domain/questionnaire/commands/abandon-cmd';
import { QuestionnaireFactory } from '../../domain/questionnaire/questionnaire-factory';
import { QuestionnaireUseCase } from '../questionnaire-uc';

export class AbandonUc extends QuestionnaireUseCase<AbandonCmdMeta> {
  protected readonly ucName = 'abandon' as const;
  protected readonly ucLabel = 'Прервать анкету' as const;
  protected readonly arMeta = {
    arName: 'Questionnaire' as const,
    arLabel: 'Анкета' as const,
  };
  protected readonly type = 'command' as const;
  protected readonly requiresAuth = true as const;
  protected readonly inputSchema = AbandonCmdSchema;
  protected readonly outputSchema = v.undefined();

  async execute(command: AbandonCmd, actorId: string): Promise<undefined> {
    const actor = await this.getUser(actorId);
    const state = await this.getQuestionnaireForEdit(
      command.questionnaireId,
      actor,
    );
    const ar = QuestionnaireFactory.restore(state);
    ar.abandon();
    await this.repo.save(ar.state);
    this.publishEvents(ar);
    return undefined;
  }
}
