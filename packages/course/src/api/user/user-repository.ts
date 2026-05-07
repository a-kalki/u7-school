import { DomainException } from "../../domain/shared/exceptions";
import type { User } from "@u7/user/domain";

/** Интерфейс репозитория пользователей */
export interface UserRepository {
	save(user: User): Promise<void>;
	getByUuid(uuid: string): Promise<User | undefined>;
	getByTelegramId(telegramId: number): Promise<User | undefined>;
	isTelegramIdTaken(telegramId: number): Promise<boolean>;
	isEmpty(): Promise<boolean>;
}

/** In-memory реализация репозитория пользователей */
export class InMemoryUserRepository implements UserRepository {
	#byUuid = new Map<string, User>();
	#byTelegramId = new Map<number, User>();

	async save(user: User): Promise<void> {
		if (this.#byUuid.has(user.uuid)) {
			throw DomainException.conflict(
				"Пользователь уже существует",
				`uuid=${user.uuid}`,
			);
		}
		this.#byUuid.set(user.uuid, user);
		this.#byTelegramId.set(user.telegramId, user);
	}

	async getByUuid(uuid: string): Promise<User | undefined> {
		return this.#byUuid.get(uuid);
	}

	async getByTelegramId(telegramId: number): Promise<User | undefined> {
		return this.#byTelegramId.get(telegramId);
	}

	async isTelegramIdTaken(telegramId: number): Promise<boolean> {
		return this.#byTelegramId.has(telegramId);
	}

	async isEmpty(): Promise<boolean> {
		return this.#byUuid.size === 0;
	}
}
