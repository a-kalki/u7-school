# Сценарий использования (UseCase)

## Назначение

Файл `api/<command-name>-uc.ts` содержит класс UC — оркестратор одной бизнес-операции. Наследуется от `UseCase<CmdMeta, Resolver>`.

## Правила

1. В основном класс опирается на каркас и поток определенный родителем концентрируясь на "личной" доменной логике.
1. Старайся разбивать логику на логические шаги, делай методы не большими но пользуйся разумностью в этом.
1. Концентрируйся на положительном потоке, если происходит прогнозируемая ошибка в потоке обработки, прерывай поток передав ошибку предусмотренным методам.

## Пример

```typescript
import { UseCase } from "@u7/core";
import { Role } from "../domain/user/roles";
import type { User } from "../domain/user/entity";
import { UserSchema } from "../domain/user/entity";
import { UserAr } from "../domain/user/a-root";
import type { UserApiModuleResolver } from "../domain/module";
import {
	type CreateUserCmd,
	CreateUserCmdSchema,
	type CreateUserCmdMeta,
} from "../domain/user/commands/create-user-cmd";

export class CreateUserUc extends UseCase<
	CreateUserCmdMeta,
	UserApiModuleResolver
> {
	protected readonly commandName = "create-user" as const;
	protected readonly description = "Создать пользователя" as const;
	protected readonly arName = "user" as const;
	protected readonly arLabel = "Пользователь" as const;
	protected readonly type = "command" as const;
	protected readonly requiresAuth = false as const;
	protected readonly inputSchema = CreateUserCmdSchema;
	protected readonly outputSchema = UserSchema;

	async execute(command: CreateUserCmd, _actorId?: string): Promise<User> {
		const repo = this.resolve.userRepo;

		const isEmpty = await repo.isEmpty();
		if (isEmpty) {
			command = { ...command, roles: [Role.ADMIN] };
		}

		if (await repo.isTelegramIdTaken(command.telegramId)) {
			this.throwConflict(
				"TELEGRAM_ID_TAKEN",
				"Пользователь с таким telegramId уже существует",
				{ telegramId: command.telegramId },
			);
		}

		const ar = UserAr.create(command);
		await repo.save(ar.state);
		return ar.state;
	}
}
```

## Тестирование

```typescript
import { describe, expect, test } from "bun:test";
import { Role } from "../../domain/user/roles";
import { UserInmemoryRepo } from "../../infra/db/user-inmemory-repo";
import { CreateUserUc } from "./create-user-uc";

describe("CreateUserUc", () => {
	test("bootstrap создаёт ADMIN", async () => {
		const uc = new CreateUserUc();
		uc.init({ userRepo: new UserInmemoryRepo() });

		const user = await uc.handle({ name: "А", telegramId: 1, roles: [Role.STUDENT] });
		expect(user.roles).toEqual([Role.ADMIN]);
	});

	test("дубликат telegramId выбрасывает", async () => {
		const repo = new UserInmemoryRepo();
		const uc = new CreateUserUc();
		uc.init({ userRepo: repo });

		await uc.handle({ name: "А", telegramId: 1, roles: [Role.ADMIN] });
		await expect(
			uc.handle({ name: "Б", telegramId: 1, roles: [Role.STUDENT] }),
		).rejects.toThrow("Пользователь с таким telegramId уже существует");
	});
});
```
