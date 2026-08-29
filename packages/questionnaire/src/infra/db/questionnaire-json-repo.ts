import type { BaseJsonDb } from '@u7-scl/core/infra';
import { JsonFileRepo } from '@u7-scl/core/infra';
import type { QuestionnaireStatus } from '#domain/questionnaire/entity';
import type {
  GetIdleQuestionnairesParams,
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

  async getActive(): Promise<QuestionnaireState[]> {
    const all = await this.readAll();
    return all.filter((q) => q.status === 'in_progress');
  }

  async getIdle<
    K extends QuestionnaireState['kind'] = QuestionnaireState['kind'],
  >(
    params: GetIdleQuestionnairesParams<K>,
  ): Promise<Array<Extract<QuestionnaireState, { kind: K }>>> {
    const statuses: QuestionnaireStatus[] = params.statuses ?? [
      'invited',
      'in_progress',
    ];
    const now = Date.now();
    const all = await this.readAll();
    return all.filter((q): q is Extract<QuestionnaireState, { kind: K }> => {
      if (!statuses.includes(q.status)) return false;
      if (params.kinds && !params.kinds.includes(q.kind as K)) {
        return false;
      }
      const idleFrom = Date.parse(q.updatedAt ?? q.createdAt);
      return now - idleFrom >= params.idleMs;
    });
  }
}
