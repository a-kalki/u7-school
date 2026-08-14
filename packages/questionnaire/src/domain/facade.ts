import type { QuestionnaireApiModule } from '../api/module';
import type { MetricQuestionPool } from './questionnaire/metric/metric-question';
import type { MetricAssessment } from './questionnaire/metric/metric-questionnaire';
import type { QuestionnairePool } from './questionnaire/question';

/**
 * Фасад модуля questionnaire.
 */
export class QuestionnaireInProcFacade {
  constructor(private readonly module: QuestionnaireApiModule) {}

  /** Создать и сразу запустить анкету. */
  async start(actorId: string, pool: QuestionnairePool): Promise<void> {
    await this.module.execute('start', { pool }, actorId);
  }

  /** Отправить приглашение на метрик-анкету (invited). */
  async sendMetricInvite(
    actorId: string,
    pool: MetricQuestionPool,
    assessment: MetricAssessment,
  ): Promise<void> {
    await this.module.execute(
      'send-metric-invite',
      { pool, assessment },
      actorId,
    );
  }
}
