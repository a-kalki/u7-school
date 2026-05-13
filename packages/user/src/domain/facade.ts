import type { User } from "./user/entity";

/**
 * Фасад модуля пользователей для внешних модулей.
 * Предоставляет методы получения информации о пользователях,
 * не раскрывая внутреннее устройство модуля @u7/user.
 */
export interface UserFacade {
	/** Получить пользователя по UUID */
	getUserByUuid(uuid: string, actorId?: string): Promise<User | undefined>;

	/** Проверить, существует ли пользователь с указанным UUID */
	userExists(uuid: string, actorId?: string): Promise<boolean>;
}
