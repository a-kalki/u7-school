import * as v from 'valibot';
import { QuestionnaireSchema } from './entity';
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
}
