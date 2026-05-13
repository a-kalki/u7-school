import { errConflict } from "@u7/core/domain";
import { UserUseCase } from "#api/user-uc";
import { UserAr } from "#domain/user/a-root";
import type { TelegramIdTakenUcError } from "#domain/user/commands/errors";
import {
	type RegisterUserCmd,
	type RegisterUserCmdMeta,
	RegisterUserCmdSchema,
} from "#domain/user/commands/register-user-cmd";
import type { User } from "#domain/user/entity";
import { UserSchema } from "#domain/user/entity";

/**
 * Use-case регистрации пользователя при первом /start в боте.
 * Создаёт пользователя с ролью GUEST. Не требует авторизации.
 */
export class RegisterUserUc extends UserUseCase<RegisterUserCmdMeta> {
	protected readonly ucName = "register-user" as const;
	protected readonly ucLabel = "Зарегистрировать пользователя" as const;
	protected readonly arMeta = {
		arName: "User",
		arLabel: "Пользователь",
	} as const;
	protected readonly type = "command" as const;
	protected readonly requiresAuth = false as const;
	protected readonly inputSchema = RegisterUserCmdSchema;
	protected readonly outputSchema = UserSchema;

	async execute(command: RegisterUserCmd): Promise<User> {
		const repo = this.resolve.userRepo;

		// Проверка уникальности telegramId
		if (await repo.isTelegramIdTaken(command.telegramId)) {
			this.throwError(
				errConflict<TelegramIdTakenUcError>(
					"TELEGRAM_ID_TAKEN",
					"Пользователь с таким telegramId уже существует",
					{ telegramId: command.telegramId },
				),
			);
		}

		const ar = UserAr.register(command);
		await repo.save(ar.state);

		return ar.state;
	}
}
