import { ApiModule } from "@u7/core/api";
import type { UserApiModuleResolver, UserModuleMeta } from "#domain/module";
import { AddRoleToUserUc } from "./user/add-role-to-user-uc";
import { CreateUserUc } from "./user/create-user-uc";
import { GetUserByTelegramIdUc } from "./user/get-user-by-telegram-id-uc";
import { GetUserUc } from "./user/get-user-uc";
import { ListUsersUc } from "./user/list-users-uc";
import { RegisterUserUc } from "./user/register-user-uc";

export class UserApiModule extends ApiModule<
	UserModuleMeta,
	UserApiModuleResolver
> {
	readonly name = "user" as const;
	readonly useCases = [
		new CreateUserUc(),
		new GetUserUc(),
		new ListUsersUc(),
		new GetUserByTelegramIdUc(),
		new RegisterUserUc(),
		new AddRoleToUserUc(),
	];
}
