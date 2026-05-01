import * as v from "valibot";
import { DomainException } from "../shared/exceptions";
import type { User } from "./user";
import { UserSchema } from "./user";

/** Команда создания пользователя */
export interface CreateUserCommand {
	name: string;
	telegramId: number;
	role: string;
}

/**
 * Агрегат пользователя.
 * Инкапсулирует состояние User и логику его изменения.
 */
export class UserAr {
	#state: User;

	private constructor(user: User) {
		this.#state = structuredClone(user);
	}

	/** Состояние агрегата только для чтения */
	get state(): Readonly<User> {
		return structuredClone(this.#state);
	}

	/**
	 * Фабричный метод создания нового пользователя из команды.
	 * Генерирует UUID и временные метки, валидирует данные через UserSchema.
	 */
	static create(command: CreateUserCommand): UserAr {
		const candidate = {
			uuid: crypto.randomUUID(),
			name: command.name,
			telegramId: command.telegramId,
			role: command.role,
			createdAt: new Date().toISOString().slice(0, 16),
		};

		const result = v.safeParse(UserSchema, candidate);

		if (!result.success) {
			const issues = v.flatten<typeof UserSchema>(result.issues).nested;
			const details = Object.entries(issues)
				.filter(([, msgs]) => msgs !== undefined)
				.map(([field, msgs]) => `${field}: ${msgs!.join("; ")}`)
				.join(" | ");

			throw new DomainException(
				"UserValidationError",
				"Некорректные данные пользователя",
				details || "Ошибка валидации",
			);
		}

		return new UserAr(result.output);
	}
}
