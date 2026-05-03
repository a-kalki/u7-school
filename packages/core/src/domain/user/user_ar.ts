import type { CreateUserCommand } from "../../api/commands/create_user_command";
import { CreateUserCommandSchema } from "../../api/commands/create_user_command";
import { parseOrThrow } from "../../api/shared/parse_or_throw";
import { isoNow } from "../shared/iso_now";
import type { User } from "./user";
import { UserSchema } from "./user";

/**
 * Проверяет инварианты пользователя через схему валидации.
 */
function validateInvariants(user: User): User {
	return parseOrThrow(
		UserSchema,
		user,
		"Некорректные данные пользователя",
		"Инварианты User несоблюдены",
	);
}

/**
 * Агрегат пользователя.
 * Инкапсулирует состояние User и логику его изменения.
 */
export class UserAr {
	#state: User;

	constructor(user: User) {
		this.#state = validateInvariants(user);
	}

	/** Состояние агрегата только для чтения */
	get state(): Readonly<User> {
		return structuredClone(this.#state);
	}

	/**
	 * Фабричный метод создания нового пользователя из команды.
	 */
	static create(command: CreateUserCommand): UserAr {
		const parsed = parseOrThrow(
			CreateUserCommandSchema,
			command,
			"Некорректная команда создания пользователя",
		);

		const candidate: User = {
			uuid: crypto.randomUUID(),
			name: parsed.name,
			telegramId: parsed.telegramId,
			role: parsed.role,
			createdAt: isoNow(),
		};

		const result = validateInvariants(candidate);
		return new UserAr(result);
	}
}
