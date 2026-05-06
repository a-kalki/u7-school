import type { User } from "../../domain/user/entity";
import type { UserRepo } from "../../domain/user/repo";

/** In-memory реализация репозитория пользователей */
export class UserInmemoryRepo implements UserRepo {
	#byUuid = new Map<string, User>();
	#byTelegramId = new Map<number, User>();

	async save(user: User): Promise<void> {
		this.#byUuid.set(user.uuid, user);
		this.#byTelegramId.set(user.telegramId, user);
	}

	async getByUuid(uuid: string): Promise<User | undefined> {
		return this.#byUuid.get(uuid);
	}

	async getByTelegramId(telegramId: number): Promise<User | undefined> {
		return this.#byTelegramId.get(telegramId);
	}

	async getAll(): Promise<User[]> {
		return Array.from(this.#byUuid.values());
	}

	async isTelegramIdTaken(telegramId: number): Promise<boolean> {
		return this.#byTelegramId.has(telegramId);
	}

	async isEmpty(): Promise<boolean> {
		return this.#byUuid.size === 0;
	}
}
