import type { BaseJsonDb } from '@u7/core/infra';
import { JsonFileRepo } from '@u7/core/infra';
import type { Questionnaire } from '#domain/questionnaire/entity';
import { QuestionnaireSchema } from '#domain/questionnaire/entity';
import type { QuestionnaireRepo } from '#domain/questionnaire/repo';

/**
 * JSON-реализация репозитория анкет.
 */
export class QuestionnaireJsonRepo
  extends JsonFileRepo<Questionnaire>
  implements QuestionnaireRepo {
  constructor(filePath: string, db?: BaseJsonDb) {
    super(QuestionnaireSchema, filePath, db, 'questionnaires');
  }

  async save(questionnaire: Questionnaire): Promise<void> {
    const all = await this.readAll();
    const idx = all.findIndex((q) => q.uuid === questionnaire.uuid);
    if (idx !== -1) all[idx] = questionnaire;
    else all.push(questionnaire);
    await this.writeAll(all);
  }

  async getByUuid(uuid: string): Promise<Questionnaire | undefined> {
    const all = await this.readAll();
    return all.find((q) => q.uuid === uuid);
  }

  async getByTelegramId(telegramId: number): Promise<Questionnaire[]> {
    const all = await this.readAll();
    return all.filter((q) => q.telegramId === telegramId);
  }
}
