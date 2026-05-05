import type { User } from "../domain/user/user";

/** Интерфейс репозитория пользователей */
export interface UserRepository {
	save(user: User): Promise<void>;
	getByUuid(uuid: string): Promise<User | undefined>;
	getByTelegramId(telegramId: number): Promise<User | undefined>;
	getAll(): Promise<User[]>;
	isTelegramIdTaken(telegramId: number): Promise<boolean>;
	isEmpty(): Promise<boolean>;
}
