import * as v from 'valibot';
import type { StartCmdMeta } from '#domain/questionnaire/commands/start-cmd';
import {
  type StartCmd,
  StartCmdSchema,
} from '#domain/questionnaire/commands/start-cmd';
import { QuestionnaireFactory } from '../../domain/questionnaire/questionnaire-factory';
import { QuestionnaireUseCase } from '../questionnaire-uc';

export class StartUc extends QuestionnaireUseCase<StartCmdMeta> {
  protected readonly ucName = 'start' as const;
  protected readonly ucLabel = 'Запустить анкету' as const;
  protected readonly arMeta = {
    arName: 'Questionnaire' as const,
    arLabel: 'Анкета' as const,
  };
  protected readonly type = 'command' as const;
  protected readonly requiresAuth = true as const;
  protected readonly inputSchema = StartCmdSchema;
  protected readonly outputSchema = v.undefined();

  async execute(command: StartCmd, actorId: string): Promise<undefined> {
    const user = await this.getUser(actorId);
    const ar = QuestionnaireFactory.createStandard(user.uuid, command.pool);
    const response = ar.start();
    await this.repo.save(ar.state);
    await this.botFacade.startQuestionnaire(user, response);
    return undefined;
  }
}
