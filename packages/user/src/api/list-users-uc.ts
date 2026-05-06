import { UseCase } from "@u7/core";
import * as v from "valibot";
import type { User } from "../domain/user/entity";
import { UserSchema } from "../domain/user/entity";
import type { UserApiModuleResolver } from "../domain/module";
import {
	type ListUsersCmd,
	ListUsersCmdSchema,
	type ListUsersCmdMeta,
} from "../domain/user/commands/list-users-cmd";

export class ListUsersUc extends UseCase<
	ListUsersCmdMeta,
	UserApiModuleResolver
> {
	protected readonly commandName = "list-users" as const;
	protected readonly description = "Список всех пользователей" as const;
	protected readonly arName = "user" as const;
	protected readonly arLabel = "Пользователь" as const;
	protected readonly type = "query" as const;
	protected readonly requiresAuth = false as const;
	protected readonly inputSchema = ListUsersCmdSchema;
	protected readonly outputSchema = v.array(UserSchema);

	async execute(): Promise<User[]> {
		return this.resolve.userRepo.getAll();
	}
}
