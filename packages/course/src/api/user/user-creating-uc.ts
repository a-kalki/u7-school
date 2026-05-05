import { DomainException } from "../../domain/shared/exceptions";
import { Role, UserAr, UserPolicy } from "@u7/auth";
import type { User, CreateUserCommand } from "@u7/auth";
import { CreateUserCommandSchema } from "@u7/auth";
import { parseOrThrow } from "../shared/parse-or-throw";
import type { UserRepository } from "./user-repository";

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
	async execute(command: CreateUserCommand, actorId?: string): Promise<User> {
		// 1. Валидация команды
		parseOrThrow(
			CreateUserCommandSchema,
			command,
			"Некорректная команда создания пользователя",
		);

		if (command.roles === undefined || command.roles.length === 0) {
			throw DomainException.validation(
				"Некорректная команда создания пользователя",
				"roles не может быть пустым",
			);
		}

		// 2. Bootstrap-режим: нет actorId → первый пользователь, только ADMIN
		if (actorId === undefined || actorId === null) {
			if (!command.roles.includes(Role.ADMIN)) {
				throw DomainException.validation(
					"Первый пользователь должен быть администратором",
					`bootstrap требует роль ADMIN, получены ${command.roles.join(",")}`,
				);
			}
		} else {
			// 3. Загружаем актора
			const actor = await this.#repo.getByUuid(actorId);
			if (!actor) {
				throw DomainException.notFound("Пользователь", actorId);
			}

			// 4. Проверка прав
			if (!UserPolicy.canCreate(actor)) {
				throw DomainException.accessDenied(
					"Недостаточно прав для создания пользователя",
					`Роль [${actor.roles.join(",")}] не может создавать пользователей`,
				);
			}
		}

		// 5. Проверка уникальности telegramId
		if (await this.#repo.isTelegramIdTaken(command.telegramId)) {
			throw DomainException.conflict(
				"Пользователь с таким telegramId уже существует",
				`telegramId=${command.telegramId}`,
			);
		}

		// 6. Создание агрегата
		const ar = UserAr.create(command);

		// 7. Сохранение
		await this.#repo.save(ar.state as User);

		return ar.state as User;
	}
}
