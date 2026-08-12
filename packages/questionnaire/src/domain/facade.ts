import type { QuestionnaireApiModule } from '../api/module';
import type { QuestionnairePool } from './questionnaire/question';

/**
 * Фасад модуля questionnaire.
 */
export class QuestionnaireInProcFacade {
  constructor(private readonly module: QuestionnaireApiModule) {}

  /** Отправить приглашение на анкету (invited). */
  async sendInvite(actorId: string, pool: QuestionnairePool): Promise<void> {
    await this.module.execute('send-invite', { pool }, actorId);
  }

  /** Создать и сразу запустить анкету. */
  async start(actorId: string, pool: QuestionnairePool): Promise<void> {
    await this.module.execute('start', { pool }, actorId);
  }
}
