import * as v from 'valibot';
import { QuestionnaireSchema } from './entity';
import { MetricQuestionnaireSchema } from './metric/metric-questionnaire';

/**
 * Состояние анкеты: обычная (`kind: 'standard'`) или метрик-анкета
 * (`kind: 'metric'`). Дискриминатор `kind` позволяет репозиторию и
 * use-case'ам различать тип и восстанавливать правильный агрегат.
 */
export const QuestionnaireStateSchema = v.variant('kind', [
  QuestionnaireSchema,
  MetricQuestionnaireSchema,
]);

export type QuestionnaireState = v.InferOutput<typeof QuestionnaireStateSchema>;

/**
 * Интерфейс репозитория анкет.
 */
export interface QuestionnaireRepo {
  /** Сохранить анкету (обычную или метрик-анкету) */
  save(questionnaire: QuestionnaireState): Promise<void>;

  /** Получить анкету по UUID */
  getByUuid(uuid: string): Promise<QuestionnaireState | undefined>;

  /** Получить все анкеты пользователя */
  getByRespondentId(respondentId: string): Promise<QuestionnaireState[]>;
}
