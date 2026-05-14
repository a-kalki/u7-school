import type { User } from "@u7/user/domain";
import { UserPolicy } from "@u7/user/domain";
import type { Questionnaire } from "./entity";

/**
 * Политика прав доступа для анкет.
 * Stateless — проверяет права на основе роли и владения.
 */
export const QuestionnairePolicy = {
	/** Создавать анкету можно только для себя. */
	canCreate(actor: User, userId: string): boolean {
		return actor.uuid === userId;
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

	/** Отвечать может только владелец и только если анкета в процессе. */
	canSubmitAnswer(actor: User, questionnaire: Questionnaire): boolean {
		return (
			this.isOwner(actor, questionnaire) &&
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
