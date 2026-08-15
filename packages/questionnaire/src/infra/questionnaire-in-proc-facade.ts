import type { QuestionnaireApiModule } from '../api/module';
import type { QuestionnaireFacade } from '../domain/facade';
import type { LikertQuestionPool } from '../domain/questionnaire/likert/likert-question';
import type { QuestionnairePool } from '../domain/questionnaire/question';

/**
 * In-proc реализация фасада questionnaire.
 * Оборачивает QuestionnaireApiModule, скрывая execute() за удобным api.
 */
export class QuestionnaireInProcFacade implements QuestionnaireFacade {
  constructor(private readonly module: QuestionnaireApiModule) {}

  async startStandard<
    TOwnerInfo extends Record<string, unknown> = Record<string, unknown>,
  >(
    actorId: string,
    pool: QuestionnairePool,
    ownerInfo: TOwnerInfo,
  ): Promise<void> {
    await this.module.execute('start', { pool, ownerInfo }, actorId);
  }

  async sendLikertInvite<
    TOwnerInfo extends Record<string, unknown> = Record<string, unknown>,
  >(
    actorId: string,
    pool: LikertQuestionPool,
    ownerInfo: TOwnerInfo,
  ): Promise<void> {
    await this.module.execute(
      'send-likert-invite',
      { pool, ownerInfo },
      actorId,
    );
  }
}
