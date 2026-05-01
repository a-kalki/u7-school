import type { User } from "../../domain/user/user";
import { DomainException } from "../../domain/shared/exceptions";

/** Интерфейс репозитория пользователей */
export interface UserRepository {
	save(user: User): void;
	getByUuid(uuid: string): User | undefined;
	getByTelegramId(telegramId: number): User | undefined;
	isTelegramIdTaken(telegramId: number): boolean;
	isEmpty(): boolean;
}

/** In-memory реализация репозитория пользователей */
export class InMemoryUserRepository implements UserRepository {
	#byUuid = new Map<string, User>();
	#byTelegramId = new Map<number, User>();

	save(user: User): void {
		if (this.#byUuid.has(user.uuid)) {
			throw DomainException.conflict(
				"Пользователь уже существует",
				`uuid=${user.uuid}`,
			);
		}
		this.#byUuid.set(user.uuid, user);
		this.#byTelegramId.set(user.telegramId, user);
	}

	getByUuid(uuid: string): User | undefined {
		return this.#byUuid.get(uuid);
	}

	getByTelegramId(telegramId: number): User | undefined {
		return this.#byTelegramId.get(telegramId);
	}

	isTelegramIdTaken(telegramId: number): boolean {
		return this.#byTelegramId.has(telegramId);
	}

	isEmpty(): boolean {
		return this.#byUuid.size === 0;
	}
}
