import { UseCase } from "@u7/core";
import { Role } from "../domain/user/roles";
import type { User } from "../domain/user/entity";
import { UserSchema } from "../domain/user/entity";
import { UserAr } from "../domain/user/a-root";
import type { UserApiModuleResolver } from "../domain/module";
import {
	type CreateUserCmd,
	CreateUserCmdSchema,
	type CreateUserCmdMeta,
} from "../domain/user/commands/create-user-cmd";

export class CreateUserUc extends UseCase<
	CreateUserCmdMeta,
	UserApiModuleResolver
> {
	protected readonly commandName = "create-user" as const;
	protected readonly description = "Создать пользователя" as const;
	protected readonly arName = "user" as const;
	protected readonly arLabel = "Пользователь" as const;
	protected readonly type = "command" as const;
	protected readonly requiresAuth = false as const;
	protected readonly inputSchema = CreateUserCmdSchema;
	protected readonly outputSchema = UserSchema;

	async execute(
		command: CreateUserCmd,
		_actorId?: string,
	): Promise<User> {
		const repo = this.resolve.userRepo;

		// Bootstrap: если репозиторий пуст, первый пользователь автоматически ADMIN
		const isEmpty = await repo.isEmpty();
		if (isEmpty) {
			command = { ...command, roles: [Role.ADMIN] };
		}

		// Проверка уникальности telegramId
		if (await repo.isTelegramIdTaken(command.telegramId)) {
			this.throwConflict(
				"TELEGRAM_ID_TAKEN",
				"Пользователь с таким telegramId уже существует",
				{ telegramId: command.telegramId },
			);
		}

		const ar = UserAr.create(command);
		await repo.save(ar.state);

		return ar.state;
	}
}
