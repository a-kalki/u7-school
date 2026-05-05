import { Module } from "@u7/core";
import { CreateUserUc } from "./use-cases/create-user-uc";
import { GetUserByTelegramIdUc } from "./use-cases/get-user-by-telegram-id-uc";
import { GetUserUc } from "./use-cases/get-user-uc";
import { ListUsersUc } from "./use-cases/list-users-uc";
import type { UserRepository } from "./user-repository";

export type AuthApiResolve = {
  userRepo: UserRepository;
};

export class AuthApiModule extends Module<
  { name: "auth"; url: "/auth" },
  AuthApiResolve
> {
  readonly name = "auth" as const;
  readonly useCases = [
    new CreateUserUc(),
    new GetUserUc(),
    new ListUsersUc(),
    new GetUserByTelegramIdUc(),
  ];
}
