import * as v from "valibot";
import { Aggregate } from "@u7/core";
import { isoNow } from "../shared/iso-now";
import type { CreateUserCommand } from "../../api/commands/create-user-command";
import type { User } from "./user";
import { UserSchema } from "./user";

/** Метаданные агрегата пользователя */
export interface UserArMeta {
	name: "user";
	label: "Пользователь";
	errors: never;
}

/**
 * Агрегат пользователя.
 * Инкапсулирует состояние User и логику его изменения.
 */
export class UserAr extends Aggregate<UserArMeta> {
	#state: User;

	constructor(user: User) {
		super();
		const result = v.safeParse(UserSchema, user);
		if (!result.success) {
			this.throwInvariant(
				{ issues: v.flatten(result.issues) },
				"Некорректные данные пользователя",
			);
		}
		this.#state = result.output;
	}

	/** Состояние агрегата только для чтения */
	get state(): Readonly<User> {
		return structuredClone(this.#state);
	}

	/**
	 * Фабричный метод создания нового пользователя из команды.
	 */
	static create(command: CreateUserCommand): UserAr {
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
