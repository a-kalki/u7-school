import type { User } from "#domain/user/entity";
import type { UserListFilter, UserRepo } from "#domain/user/repo";

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

	async getAll(filter?: UserListFilter): Promise<User[]> {
		let users = Array.from(this.#byUuid.values());

		if (filter) {
			if (filter.role) {
				users = users.filter((u) => u.roles.includes(filter.role!));
			}

			if (filter.name) {
				const nameLower = filter.name.toLowerCase();
				users = users.filter((u) =>
					u.name.toLowerCase().includes(nameLower),
				);
			}

			if (filter.telegramId !== undefined) {
				users = users.filter((u) => u.telegramId === filter.telegramId);
			}

			if (filter.sort) {
				const [field, dir] = filter.sort.split(":") as [
					"createdAt" | "name",
					"asc" | "desc",
				];
				const multiplier = dir === "asc" ? 1 : -1;
				users.sort((a, b) => {
					const va = a[field];
					const vb = b[field];
					if (va < vb) return -1 * multiplier;
					if (va > vb) return 1 * multiplier;
					return 0;
				});
			}

			if (filter.limit !== undefined && filter.limit > 0) {
				users = users.slice(0, filter.limit);
			}
		}

		return users;
	}

	async isTelegramIdTaken(telegramId: number): Promise<boolean> {
		return this.#byTelegramId.has(telegramId);
	}

	async isEmpty(): Promise<boolean> {
		return this.#byUuid.size === 0;
	}
}
