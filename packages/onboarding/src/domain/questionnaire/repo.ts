import type { Questionnaire } from "./entity";

/**
 * Интерфейс репозитория анкет.
 */
export interface QuestionnaireRepo {
	/** Сохранить анкету */
	save(questionnaire: Questionnaire): Promise<void>;

	/** Получить анкету по UUID */
	getByUuid(uuid: string): Promise<Questionnaire | undefined>;

	/** Получить все анкеты пользователя */
	getByUserId(userId: string): Promise<Questionnaire[]>;
}
