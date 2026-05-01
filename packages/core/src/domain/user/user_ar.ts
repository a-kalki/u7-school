import * as v from "valibot";
import type { CreateUserCommand } from "../../api/commands/create_user_command";
import { CreateUserCommandSchema } from "../../api/commands/create_user_command";
import { DomainException } from "../shared/exceptions";
import { isoNow } from "../shared/iso_now";
import type { User } from "./user";
import { UserSchema } from "./user";

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
	 * Проверяет инварианты агрегата через схему валидации.
	 * Выбрасывает DomainException.validation при нарушении.
	 */
	validateInvariants(): void {
		const result = v.safeParse(UserSchema, this.#state);
		if (!result.success) {
			throw DomainException.validation(
				"Некорректные данные пользователя",
				"Нарушение инвариантов UserAr",
				v.flatten<typeof UserSchema>(result.issues),
			);
		}
	}

	/**
	 * Фабричный метод создания нового пользователя из команды.
	 * Генерирует UUID и временные метки, валидирует данные.
	 */
	static create(command: CreateUserCommand): UserAr {
		// 1. Валидация входящей команды
		const cmdResult = v.safeParse(CreateUserCommandSchema, command);
		if (!cmdResult.success) {
			throw DomainException.validation(
				"Некорректная команда создания пользователя",
				"Ошибка валидации CreateUserCommand",
				v.flatten<typeof CreateUserCommandSchema>(cmdResult.issues),
			);
		}

		// 2. Формирование кандидата
		const candidate: User = {
			uuid: crypto.randomUUID(),
			name: cmdResult.output.name,
			telegramId: cmdResult.output.telegramId,
			role: cmdResult.output.role,
			createdAt: isoNow(),
		};

		// 3. Проверка инвариантов
		const userResult = v.safeParse(UserSchema, candidate);
		if (!userResult.success) {
			throw DomainException.validation(
				"Некорректные данные пользователя",
				"Ошибка валидации UserSchema",
				v.flatten<typeof UserSchema>(userResult.issues),
			);
		}

		return new UserAr(userResult.output);
	}
}
