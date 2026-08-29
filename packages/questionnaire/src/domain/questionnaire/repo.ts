import * as v from 'valibot';
import { QuestionnaireSchema, type QuestionnaireStatus } from './entity';
import { LikertQuestionnaireSchema } from './likert/likert-questionnaire';

/**
 * Состояние анкеты: обычная (`kind: 'standard'`) или likert-анкета
 * (`kind: 'likert'`). Дискриминатор `kind` позволяет репозиторию и
 * use-case'ам различать тип и восстанавливать правильный агрегат.
 */
export const QuestionnaireStateSchema = v.variant('kind', [
  QuestionnaireSchema,
  LikertQuestionnaireSchema,
]);

export type QuestionnaireState = v.InferOutput<typeof QuestionnaireStateSchema>;

/**
 * Параметры выборки неактивных анкет — все фильтры применяются в запросе.
 * Тип K связан с kinds: позволяет сузить возвращаемый тип до нужного варианта.
 */
export interface GetIdleQuestionnairesParams<
  K extends QuestionnaireState['kind'] = QuestionnaireState['kind'],
> {
  /** Минимальный простой в мс — от `updatedAt ?? createdAt` */
  idleMs: number;
  /** Типы анкет; если не указан — все типы */
  kinds?: K[];
  /** Статусы анкет; если не указан — активные (invited, in_progress) */
  statuses?: QuestionnaireStatus[];
}

/**
 * Интерфейс репозитория анкет.
 */
export interface QuestionnaireRepo {
  /** Сохранить анкету (обычную или likert-анкету) */
  save(questionnaire: QuestionnaireState): Promise<void>;

  /** Получить анкету по UUID */
  getByUuid(uuid: string): Promise<QuestionnaireState | undefined>;

  /** Получить все анкеты пользователя */
  getByRespondentId(respondentId: string): Promise<QuestionnaireState[]>;

  /** Получить все активные анкеты (в статусе in_progress) — для планировщика брошенных анкет */
  getActive(): Promise<QuestionnaireState[]>;

  /**
   * Получить неактивные анкеты — для планировщика брошенных анкет.
   * Возвращает незавершённые анкеты с простоем от `updatedAt ?? createdAt`
   * не меньше порога. По умолчанию — активные анкеты, включая выданные,
   * но не начатые (invited). Все фильтры применяются в запросе.
   *
   * @typeParam K — типы анкет: при указании kinds возвращаемый тип
   *   сужается до соответствующих вариантов QuestionnaireState.
   */
  getIdle<K extends QuestionnaireState['kind'] = QuestionnaireState['kind']>(
    params: GetIdleQuestionnairesParams<K>,
  ): Promise<Array<Extract<QuestionnaireState, { kind: K }>>>;
}
