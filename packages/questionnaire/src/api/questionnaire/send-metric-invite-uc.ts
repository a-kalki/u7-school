import * as v from 'valibot';
import type { SendMetricInviteCmdMeta } from '#domain/questionnaire/commands/send-metric-invite-cmd';
import {
  type SendMetricInviteCmd,
  SendMetricInviteCmdSchema,
} from '#domain/questionnaire/commands/send-metric-invite-cmd';
import { QuestionnaireFactory } from '../../domain/questionnaire/questionnaire-factory';
import { QuestionnaireUseCase } from '../questionnaire-uc';

export class SendMetricInviteUc extends QuestionnaireUseCase<SendMetricInviteCmdMeta> {
  protected readonly ucName = 'send-metric-invite' as const;
  protected readonly ucLabel = 'Пригласить на метрик-анкету' as const;
  protected readonly arMeta = {
    arName: 'Questionnaire' as const,
    arLabel: 'Анкета' as const,
  };
  protected readonly type = 'command' as const;
  protected readonly requiresAuth = true as const;
  protected readonly inputSchema = SendMetricInviteCmdSchema;
  protected readonly outputSchema = v.undefined();

  async execute(
    command: SendMetricInviteCmd,
    actorId: string,
  ): Promise<undefined> {
    const user = await this.getUser(actorId);
    const ar = QuestionnaireFactory.createMetric(
      user.uuid,
      command.pool,
      command.assessment,
    );
    await this.repo.save(ar.state);
    const response = ar.getInvite();
    await this.botFacade.sendQuestionnaireInvite(user, response);
    return undefined;
  }
}
