import type { BaseJsonDb } from '@u7-scl/core/infra';
import { JsonFileRepo } from '@u7-scl/core/infra';
import type {
  QuestionnaireRepo,
  QuestionnaireState,
} from '#domain/questionnaire/repo';
import { QuestionnaireStateSchema } from '#domain/questionnaire/repo';

/**
 * JSON-реализация репозитория анкет модуля questionnaire.
 * Хранит и обычные, и метрик-анкеты (дискриминатор `kind`).
 */
export class QuestionnaireJsonRepo
  extends JsonFileRepo<QuestionnaireState>
  implements QuestionnaireRepo
{
  constructor(filePath: string, db?: BaseJsonDb) {
    super(QuestionnaireStateSchema, filePath, db, 'questionnaires');
  }

  async save(questionnaire: QuestionnaireState): Promise<void> {
    const all = await this.readAll();
    const idx = all.findIndex((q) => q.uuid === questionnaire.uuid);
    if (idx !== -1) all[idx] = questionnaire;
    else all.push(questionnaire);
    await this.writeAll(all);
  }

  async getByUuid(uuid: string): Promise<QuestionnaireState | undefined> {
    const all = await this.readAll();
    return all.find((q) => q.uuid === uuid);
  }

  async getByRespondentId(respondentId: string): Promise<QuestionnaireState[]> {
    const all = await this.readAll();
    return all.filter((q) => q.respondentId === respondentId);
  }
}
