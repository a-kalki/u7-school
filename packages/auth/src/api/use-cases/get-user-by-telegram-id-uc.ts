import * as v from "valibot";
import { UseCase } from "@u7/core";
import type { User } from "../../domain/user/user";
import { UserSchema } from "../../domain/user/user";
import type { UserRepository } from "../user-repository";
import type { AuthUcErrors } from "./types";

const GetUserByTelegramIdInputSchema = v.object({
	telegramId: v.pipe(
		v.number(),
		v.integer("telegramId должен быть целым числом"),
		v.minValue(1, "telegramId должен быть положительным"),
	),
});

type GetUserByTelegramIdInput = v.InferOutput<typeof GetUserByTelegramIdInputSchema>;

export interface GetUserByTelegramIdUcMeta {
	commandName: "get-user-by-telegram-id";
	description: "Найти пользователя по Telegram ID";
	arMeta: { name: "user"; label: "Пользователь"; errors: never };
	input: GetUserByTelegramIdInput;
	output: User;
	errors: AuthUcErrors;
	requiresAuth: false;
	type: "query";
}

export class GetUserByTelegramIdUc extends UseCase<
	GetUserByTelegramIdUcMeta,
	{ userRepo: UserRepository }
> {
	protected readonly commandName = "get-user-by-telegram-id" as const;
	protected readonly description = "Найти пользователя по Telegram ID" as const;
	protected readonly aggregateName = "user" as const;
	protected readonly aggregateLabel = "Пользователь" as const;
	protected readonly type = "query" as const;
	protected readonly requiresAuth = false as const;
	protected readonly inputSchema = GetUserByTelegramIdInputSchema;
	protected readonly outputSchema = UserSchema;

	async execute(command: GetUserByTelegramIdInput): Promise<User> {
		const user = await this.resolve.userRepo.getByTelegramId(command.telegramId);
		if (!user) {
			this.throwNotFound(
				"USER_NOT_FOUND",
				"Пользователь не найден",
				{ telegramId: command.telegramId },
			);
		}
		return user;
	}
}
