import { UseCase } from "@u7/core";
import * as v from "valibot";
import type { User } from "../../domain/user/user";
import { UserSchema } from "../../domain/user/user";
import type { UserArMeta } from "../../domain/user/user-ar";
import type { AuthApiResolve } from "../auth-module";

const ListUsersInputSchema = v.object({});

const ListUsersOutputSchema = v.array(UserSchema);

export interface ListUsersUcMeta {
  commandName: "list-users";
  description: "Список всех пользователей";
  arMeta: UserArMeta;
  input: Record<string, never>;
  output: User[];
  errors: never;
  requiresAuth: false;
  type: "query";
}

export class ListUsersUc extends UseCase<ListUsersUcMeta, AuthApiResolve> {
  protected readonly commandName = "list-users" as const;
  protected readonly description = "Список всех пользователей" as const;
  protected readonly arName = "user" as const;
  protected readonly arLabel = "Пользователь" as const;
  protected readonly type = "query" as const;
  protected readonly requiresAuth = false as const;
  protected readonly inputSchema = ListUsersInputSchema;
  protected readonly outputSchema = ListUsersOutputSchema;

  async execute(): Promise<User[]> {
    return this.resolve.userRepo.getAll();
  }
}
