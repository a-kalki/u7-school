import type { QuestionnaireApiModule } from '../api/module';
import type { LikertQuestionPool } from './questionnaire/likert/likert-question';
import type { QuestionnairePool } from './questionnaire/question';

/**
 * Фасад модуля questionnaire.
 */
export class QuestionnaireInProcFacade {
  constructor(private readonly module: QuestionnaireApiModule) {}

  /** Создать и сразу запустить обычную анкету. */
  async startStandard<
    TOwnerInfo extends Record<string, unknown> = Record<string, unknown>,
  >(
    actorId: string,
    pool: QuestionnairePool,
    ownerInfo: TOwnerInfo,
  ): Promise<void> {
    await this.module.execute('start', { pool, ownerInfo }, actorId);
  }

  /** Отправить приглашение на likert-анкету (invited). */
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
