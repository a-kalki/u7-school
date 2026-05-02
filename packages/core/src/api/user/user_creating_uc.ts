import type { CreateUserCommand } from "../commands/create_user_command";
import { CreateUserCommandSchema } from "../commands/create_user_command";
import { parseOrThrow } from "../shared/parse_or_throw";
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
	 * @param actorId — uuid пользователя, выполняющего действие (опционально; без него — bootstrap)
	 */
	execute(command: CreateUserCommand, actorId?: string): User {
		// 1. Валидация команды
		parseOrThrow(
			CreateUserCommandSchema,
			command,
			"Некорректная команда создания пользователя",
		);

		// 2. Bootstrap-режим: нет actorId → первый пользователь, только ADMIN
		if (actorId === undefined || actorId === null) {
			if (command.role !== "ADMIN") {
				throw DomainException.validation(
					"Первый пользователь должен быть администратором",
					`bootstrap требует роль ADMIN, получена ${command.role}`,
				);
			}
		} else {
			// 3. Загружаем актора
			const actor = this.#repo.getByUuid(actorId);
			if (!actor) {
				throw DomainException.notFound("Пользователь", actorId);
			}

			// 4. Проверка прав
			if (!UserPolicy.canCreate(actor)) {
				throw ApiException.accessDenied(
					"Недостаточно прав для создания пользователя",
					`Роль ${actor.role} не может создавать пользователей`,
				);
			}
		}

		// 5. Проверка уникальности telegramId
		if (this.#repo.isTelegramIdTaken(command.telegramId)) {
			throw DomainException.conflict(
				"Пользователь с таким telegramId уже существует",
				`telegramId=${command.telegramId}`,
			);
		}

		// 6. Создание агрегата
		const ar = UserAr.create(command);

		// 7. Сохранение
		this.#repo.save(ar.state as User);

		return ar.state as User;
	}
}
