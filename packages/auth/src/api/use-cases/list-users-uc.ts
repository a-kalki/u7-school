import * as v from "valibot";
import { UseCase } from "@u7/core";
import type { User } from "../../domain/user/user";
import { UserSchema } from "../../domain/user/user";
import type { UserRepository } from "../user-repository";
import type { AuthUcErrors } from "./types";

const ListUsersInputSchema = v.object({});

const ListUsersOutputSchema = v.array(UserSchema);

export interface ListUsersUcMeta {
	commandName: "list-users";
	description: "Список всех пользователей";
	arMeta: { name: "user"; label: "Пользователь"; errors: never };
	input: Record<string, never>;
	output: User[];
	errors: AuthUcErrors;
	requiresAuth: false;
	type: "query";
}

export class ListUsersUc extends UseCase<ListUsersUcMeta, { userRepo: UserRepository }> {
	protected readonly commandName = "list-users" as const;
	protected readonly description = "Список всех пользователей" as const;
	protected readonly aggregateName = "user" as const;
	protected readonly aggregateLabel = "Пользователь" as const;
	protected readonly type = "query" as const;
	protected readonly requiresAuth = false as const;
	protected readonly inputSchema = ListUsersInputSchema;
	protected readonly outputSchema = ListUsersOutputSchema;

	async execute(): Promise<User[]> {
		return this.resolve.userRepo.getAll();
	}
}
