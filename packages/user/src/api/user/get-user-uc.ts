import { UserUseCase } from "#api/user-uc";
import { UserAr } from "#domain/user/a-root";
import {
	type GetUserCmd,
	type GetUserCmdMeta,
	GetUserCmdSchema,
} from "#domain/user/commands/get-user-cmd";
import type { User } from "#domain/user/entity";
import { UserSchema } from "#domain/user/entity";

/**
 * Use-case получения пользователя по UUID.
 * Доступно всем (checkPolicy — пустая реализация).
 */
export class GetUserUc extends UserUseCase<GetUserCmdMeta> {
	protected readonly ucName = "get-user" as const;
	protected readonly ucLabel = "Получить пользователя по UUID" as const;
	protected readonly arMeta = {
		arName: UserAr.arName as "User",
		arLabel: UserAr.arLabel as "Пользователь",
	};
	protected readonly type = "query" as const;
	protected readonly requiresAuth = false as const;
	protected readonly inputSchema = GetUserCmdSchema;
	protected readonly outputSchema = UserSchema;

	async execute(command: GetUserCmd): Promise<User> {
		return this.getActor(command.uuid);
	}
}
