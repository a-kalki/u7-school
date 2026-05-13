import { type AuthError, errConflict, errUnauthorized } from "@u7/core/domain";
import { UserUseCase } from "#api/user-uc";
import { UserAr } from "#domain/user/a-root";
import {
	type CreateUserCmd,
	type CreateUserCmdMeta,
	CreateUserCmdSchema,
} from "#domain/user/commands/create-user-cmd";
import type {
	BootstrapRequiresAdminUcError,
	TelegramIdTakenUcError,
} from "#domain/user/commands/errors";
import type { User } from "#domain/user/entity";
import { UserSchema } from "#domain/user/entity";
import { UserPolicy } from "#domain/user/policy";
import { Role } from "#domain/user/roles";

/**
 * Use-case создания пользователя.
 * Требует прав ADMIN (кроме bootstrap — первый пользователь при пустом репозитории,
 * но даже в bootstrap первый пользователь обязан иметь роль ADMIN в команде).
 */
export class CreateUserUc extends UserUseCase<CreateUserCmdMeta> {
	protected readonly ucName = "create-user" as const;
	protected readonly ucLabel = "Создать пользователя" as const;
	protected readonly arMeta = {
		arName: UserAr.arName as "User",
		arLabel: UserAr.arLabel as "Пользователь",
	};
	protected readonly type = "command" as const;
	protected readonly requiresAuth = false as const;
	protected readonly inputSchema = CreateUserCmdSchema;
	protected readonly outputSchema = UserSchema;

	async execute(command: CreateUserCmd, actorId?: string): Promise<User> {
		const repo = this.resolve.userRepo;
		const isEmpty = await repo.isEmpty();

		if (isEmpty) {
			// Bootstrap: первый пользователь обязан иметь роль ADMIN
			if (!command.roles.includes(Role.ADMIN)) {
				this.throwError(
					errConflict<BootstrapRequiresAdminUcError>(
						"BOOTSTRAP_REQUIRES_ADMIN",
						"Первый пользователь должен иметь роль ADMIN",
						undefined,
					),
				);
			}
		} else {
			// Репозиторий не пуст — требуется авторизованный ADMIN
			if (!actorId) {
				this.throwBaseErrors(
					errUnauthorized<AuthError>(
						"UNAUTHORIZED_ERROR",
						"Требуется авторизация",
					),
				);
			}
			const actor = await this.getActor(actorId);
			if (!UserPolicy.canCreate(actor)) {
				this.throwAccessDenied("Недостаточно прав для создания пользователя");
			}
		}

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

		const ar = UserAr.create(command);
		await repo.save(ar.state);

		return ar.state;
	}
}
