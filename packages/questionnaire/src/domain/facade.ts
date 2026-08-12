import type { User } from '@u7-scl/user/domain';
import type { QuestionnaireApiModule } from '../api/module';
import type { QuestionnairePool } from './questionnaire/question';

/**
 * Фасад модуля questionnaire для вызова из других модулей.
 * Использует путь A: UC → botFacade (бот рендерит приглашения и вопросы).
 */
export class QuestionnaireInProcFacade {
  constructor(private readonly module: QuestionnaireApiModule) {}

  /** Отправить приглашение на анкету (invited). UC вызывает botFacade. */
  async sendInvite(user: User, pool: QuestionnairePool): Promise<void> {
    await this.module.execute('send-invite', { user, pool }, undefined);
  }

  /** Создать и сразу запустить анкету. UC вызывает botFacade. */
  async start(user: User, pool: QuestionnairePool): Promise<void> {
    await this.module.execute('start', { user, pool }, undefined);
  }
}
