import { Role, type User, UserAr } from "@u7/user/domain";
import { ApplicationAr } from "./application/a-root";
import type { CreateApplicationCmd } from "./application/commands/create-application-cmd";

/**
 * Доменный сервис onboarding.
 * Координирует создание заявки и присвоение роли CANDIDATE.
 * Возвращает изменённые агрегаты для сохранения в БД.
 */
export class OnboardingDs {
	/**
	 * Создаёт заявку и подготавливает пользователя с ролью CANDIDATE.
	 */
	createApplication(
		command: CreateApplicationCmd,
		user: User,
	): { application: ApplicationAr; userAr: UserAr } {
		const application = ApplicationAr.create(command);
		const userAr = new UserAr(user);
		userAr.addRole(Role.CANDIDATE);
		return { application, userAr };
	}
}
