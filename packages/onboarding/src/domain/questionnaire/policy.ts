import type { User } from "@u7/user/domain";
import { UserPolicy } from "@u7/user/domain";
import type { Questionnaire } from "./entity";

/**
 * Политика прав доступа для анкет.
 * Stateless — проверяет права на основе роли и владения.
 */
export const QuestionnairePolicy = {
	/**
	 * Создавать анкету может сам пользователь или ADMIN (например, бот).
	 */
	canCreate(actor: User, userId: string): boolean {
		return actor.uuid === userId || UserPolicy.isAdmin(actor);
	},

	/** Читать может владелец, ADMIN или MENTOR. */
	canRead(actor: User, questionnaire: Questionnaire): boolean {
		return (
			this.isOwner(actor, questionnaire) ||
			UserPolicy.isAdmin(actor) ||
			UserPolicy.isMentor(actor)
		);
	},

	/** Список может просматривать ADMIN или MENTOR. */
	canList(actor: User): boolean {
		return UserPolicy.isAdmin(actor) || UserPolicy.isMentor(actor);
	},

	/**
	 * Отвечать может владелец или ADMIN (например, бот),
	 * и только если анкета в процессе.
	 */
	canSubmitAnswer(actor: User, questionnaire: Questionnaire): boolean {
		return (
			(this.isOwner(actor, questionnaire) || UserPolicy.isAdmin(actor)) &&
			questionnaire.status === "in_progress"
		);
	},

	/** Прерывать может владелец или ADMIN. */
	canAbandon(actor: User, questionnaire: Questionnaire): boolean {
		return this.isOwner(actor, questionnaire) || UserPolicy.isAdmin(actor);
	},

	/** Является ли актор владельцем анкеты. */
	isOwner(actor: User, questionnaire: Questionnaire): boolean {
		return actor.uuid === questionnaire.userId;
	},
};
