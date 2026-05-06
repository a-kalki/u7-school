import { Module } from "@u7/core";
import type { UserApiModuleResolver, UserModuleMeta } from "../domain/module";
import { CreateUserUc } from "./user/create-user-uc";
import { GetUserByTelegramIdUc } from "./user/get-user-by-telegram-id-uc";
import { GetUserUc } from "./user/get-user-uc";
import { ListUsersUc } from "./user/list-users-uc";

export class UserApiModule extends Module<
  UserModuleMeta,
  UserApiModuleResolver
> {
  readonly name = "user" as const;
  readonly useCases = [
    new CreateUserUc(),
    new GetUserUc(),
    new ListUsersUc(),
    new GetUserByTelegramIdUc(),
  ];
}
