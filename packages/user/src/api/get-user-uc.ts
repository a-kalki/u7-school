import { UseCase } from "@u7/core";
import type { User } from "../domain/user/entity";
import { UserSchema } from "../domain/user/entity";
import type { UserApiModuleResolver } from "../domain/module";
import {
	type GetUserCmd,
	GetUserCmdSchema,
	type GetUserCmdMeta,
} from "../domain/user/commands/get-user-cmd";

export class GetUserUc extends UseCase<GetUserCmdMeta, UserApiModuleResolver> {
	protected readonly commandName = "get-user" as const;
	protected readonly description = "Получить пользователя по UUID" as const;
	protected readonly arName = "user" as const;
	protected readonly arLabel = "Пользователь" as const;
	protected readonly type = "query" as const;
	protected readonly requiresAuth = false as const;
	protected readonly inputSchema = GetUserCmdSchema;
	protected readonly outputSchema = UserSchema;

	async execute(command: GetUserCmd): Promise<User> {
		const user = await this.resolve.userRepo.getByUuid(command.uuid);
		if (!user) {
			this.throwNotFound("USER_NOT_FOUND", "Пользователь не найден", {
				uuid: command.uuid,
			});
		}
		return user;
	}
}
