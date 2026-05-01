import * as v from "valibot";

/**
 * Роли пользователей платформы u7-school.
 * - STUDENT: ученик, проходящий обучение
 * - MENTOR: наставник, создающий курсы и проверяющий задания
 * - ADMIN: администратор платформы
 */
export enum Role {
	STUDENT = "STUDENT",
	MENTOR = "MENTOR",
	ADMIN = "ADMIN",
}

/** Valibot-схема для валидации роли пользователя */
export const RoleSchema = v.picklist(
	[Role.STUDENT, Role.MENTOR, Role.ADMIN],
	`Недопустимая роль. Ожидается: ${Object.keys(Role).join(",")}`,
);
