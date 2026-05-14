import * as v from "valibot";

/**
 * Статус заявки кандидата.
 */
export enum ApplicationStatus {
	/** Заявка подана */
	SUBMITTED = "SUBMITTED",
	/** Заявка одобрена */
	APPROVED = "APPROVED",
	/** Заявка отклонена */
	REJECTED = "REJECTED",
}

/** Схема валидации статуса заявки */
export const ApplicationStatusSchema = v.picklist(
	Object.values(ApplicationStatus),
	"Недопустимый статус заявки",
);
