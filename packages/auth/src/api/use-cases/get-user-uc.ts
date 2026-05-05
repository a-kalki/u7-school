import { UseCase } from "@u7/core";
import * as v from "valibot";
import type { User } from "../../domain/user/user";
import { UserSchema } from "../../domain/user/user";
import type { UserRepository } from "../user-repository";
import type { AuthUcErrors } from "./types";

const GetUserInputSchema = v.object({
	uuid: v.pipe(v.string(), v.uuid("Некорректный формат UUID")),
});

type GetUserInput = v.InferOutput<typeof GetUserInputSchema>;

export interface GetUserUcMeta {
	commandName: "get-user";
	description: "Получить пользователя по UUID";
	arMeta: { name: "user"; label: "Пользователь"; errors: never };
	input: GetUserInput;
	output: User;
	errors: AuthUcErrors;
	requiresAuth: false;
	type: "query";
}

export class GetUserUc extends UseCase<
	GetUserUcMeta,
	{ userRepo: UserRepository }
> {
	protected readonly commandName = "get-user" as const;
	protected readonly description = "Получить пользователя по UUID" as const;
	protected readonly aggregateName = "user" as const;
	protected readonly aggregateLabel = "Пользователь" as const;
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
