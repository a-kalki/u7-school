import * as v from "valibot";
import type { CreateUserCommand } from "../commands/create_user_command";
import { CreateUserCommandSchema } from "../commands/create_user_command";
import { ApiException } from "../../domain/shared/exceptions";
import { DomainException } from "../../domain/shared/exceptions";
import type { User } from "../../domain/user/user";
import { UserAr } from "../../domain/user/user_ar";
import { UserPolicy } from "../../domain/user/user_policy";
import type { UserRepository } from "./user_repository";

/**
 * Сценарий использования: создание пользователя.
 */
export class UserCreatingUc {
	#repo: UserRepository;

	constructor(repo: UserRepository) {
		this.#repo = repo;
	}

	/**
	 * Выполняет создание пользователя.
	 * @param command — команда создания
	 * @param actor — пользователь, выполняющий действие (опционально; если не передан — bootstrap)
	 */
	execute(command: CreateUserCommand, actor?: User): User {
		// 1. Валидация команды
		const cmdResult = v.safeParse(CreateUserCommandSchema, command);
		if (!cmdResult.success) {
			throw DomainException.validation(
				"Некорректная команда создания пользователя",
				"Ошибка валидации CreateUserCommand",
				v.flatten<typeof CreateUserCommandSchema>(cmdResult.issues),
			);
		}

		// 2. Проверка прав (не в bootstrap-режиме)
		if (actor !== undefined) {
			if (!UserPolicy.canCreate(actor)) {
				throw ApiException.accessDenied(
					"Недостаточно прав для создания пользователя",
					`Роль ${actor.role} не может создавать пользователей`,
				);
			}
		}

		// 3. Проверка уникальности telegramId
		if (this.#repo.isTelegramIdTaken(command.telegramId)) {
			throw DomainException.conflict(
				"Пользователь с таким telegramId уже существует",
				`telegramId=${command.telegramId}`,
			);
		}

		// 4. Создание агрегата
		const ar = UserAr.create(cmdResult.output);

		// 5. Сохранение
		this.#repo.save(ar.state as User);

		return ar.state as User;
	}
}
