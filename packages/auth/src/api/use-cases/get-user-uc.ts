import { UseCase } from "@u7/core";
import * as v from "valibot";
import type { User } from "../../domain/user/user";
import { UserSchema } from "../../domain/user/user";
import type { UserArMeta } from "../../domain/user/user-ar";
import type { AuthApiResolve } from "../auth-module";
import type { AuthUcErrors } from "./types";

const GetUserInputSchema = v.object({
  uuid: UserSchema.entries.uuid,
});

type GetUserInput = v.InferOutput<typeof GetUserInputSchema>;

export interface GetUserUcMeta {
  commandName: "get-user";
  description: "Получить пользователя по UUID";
  arMeta: UserArMeta;
  input: GetUserInput;
  output: User;
  errors: AuthUcErrors;
  requiresAuth: false;
  type: "query";
}

export class GetUserUc extends UseCase<GetUserUcMeta, AuthApiResolve> {
  protected readonly commandName = "get-user" as const;
  protected readonly description = "Получить пользователя по UUID" as const;
  protected readonly arName = "user" as const;
  protected readonly arLabel = "Пользователь" as const;
  protected readonly type = "query" as const;
  protected readonly requiresAuth = false as const;
  protected readonly inputSchema = GetUserInputSchema;
  protected readonly outputSchema = UserSchema;

  async execute(command: GetUserInput): Promise<User> {
    const user = await this.resolve.userRepo.getByUuid(command.uuid);
    if (!user) {
      this.throwNotFound("USER_NOT_FOUND", "Пользователь не найден", {
        uuid: command.uuid,
      });
    }
    return user;
  }
}
