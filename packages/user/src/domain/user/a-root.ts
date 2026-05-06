import { Aggregate, isoNow } from "@u7/core";
import type { CreateUserCmd } from "./commands/create-user-cmd";
import type { User, UserArMeta } from "./entity";
import { UserSchema } from "./entity";

/**
 * Агрегат пользователя.
 * Инкапсулирует состояние User и логику его изменения.
 */
export class UserAr extends Aggregate<UserArMeta> {
	constructor(state: User) {
		super(state, UserSchema);
	}

	/**
	 * Фабричный метод создания нового пользователя из команды.
	 */
	static create(command: CreateUserCmd): UserAr {
		const candidate: User = {
			uuid: crypto.randomUUID(),
			name: command.name,
			telegramId: command.telegramId,
			roles: command.roles,
			createdAt: isoNow(),
		};

		return new UserAr(candidate);
	}
}
