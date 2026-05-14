# Модуль

## Три уровня модуля

| Уровень | Класс/тип | Файл | Назначение |
|---|---|---|---|
| Domain | `UserModuleMeta`, `UserApiModuleResolver` | `domain/module.ts` | Типы: мета модуля и контракт зависимостей |
| API | `UserApiModule` | `api/module.ts` | Диспетчер: регистрация UC, роутинг команд |
| UI | `UserAutoUiModule` | `ui/auto-ui/module.ts` | Модули интерфейса, могут быть несколько реализации |

## Domain: module.ts

- `ModuleMeta` описывает контракт для модулей слоев `Api`, `Ui`.
- Каждый модуль описывает свой тип `Resolver`.

```typescript
import type { UserRepo } from "./user/repo";

export interface UserModuleMeta {
	name: "user";
	url: "/user";
}

export interface UserApiModuleResolver {
	userRepo: UserRepo;
}
```

## API: module.ts

- Каждый модуль получает `Resolver` в конструкторе.
- Модуль предоставляет `Resolver` всем дочерним заинтересованным объектам через механизм инициализации.
- В `ApiModule` регистрируются все `UseCase` модуля для обработки "своих" команд.

```typescript
import { Module } from "@u7/core";
import { CreateUserUc } from "./create-user-uc";
import { GetUserUc } from "./get-user-uc";
import { ListUsersUc } from "./list-users-uc";
import { GetUserByTelegramIdUc } from "./get-user-by-telegram-id-uc";
import type { UserApiModuleResolver } from "../domain/module";

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
```

## Тестирование API-модуля

1. Тестирование модуля сводится как правило к тесту одного самого длинного (обычно успешного) сценария каждого подключенного `usecase`.
1. Основная задача теста убедиться что `usecase` подключен и обрабатывает команды.
1. В тестах используй реальные реализации (имплементации) репозиториев, фасадов. Твоя задача убедиться что имплементации нормально работают. Запрещено "придумывать" свои репозитории типа inMemory или мокать. 
1. Не выходи в тестах за пределы ответственности объекта.
1. Выноси повторяющуюся логику в хелперы.
1. Стремись чтобы каждый тест был не более 10 строк кода, пусть тест будет кратким и понятным.

```typescript
import { describe, expect, test } from "bun:test";
import type { User } from "../domain/user/entity";
import { Role } from "../domain/user/roles";
import { UserInmemoryRepo } from "../infra/db/user-inmemory-repo";
import { UserApiModule } from "./module";

describe("UserApiModule", () => {
	test("createg-user: бутстрап создаёт ADMIN", async () => {
		const mod = new UserApiModule();
		mod.init({ userRepo: new UserInmemoryRepo() });

		const result = await mod.handle({
			name: "create-user",
			attrs: { name: "А", telegramId: 1, roles: [Role.STUDENT] },
		});
		expect((result as User).roles).toEqual([Role.ADMIN]);
	});

	test("create-user: второй пользователь сохраняет роли", async () => {
		const repo = new UserInmemoryRepo();
		const mod = new UserApiModule();
		mod.init({ userRepo: repo });

		await mod.handle({
			name: "create-user",
			attrs: { name: "Админ", telegramId: 1, roles: [Role.ADMIN] },
		});
		const result = await mod.handle({
			name: "create-user",
			attrs: { name: "Студент", telegramId: 2, roles: [Role.STUDENT] },
		});
		expect((result as User).roles).toEqual([Role.STUDENT]);
	});

	test("get-user: возвращает пользователя", async () => {
		const repo = new UserInmemoryRepo();
		const user: User = {
			uuid: "550e8400-e29b-41d4-a716-446655440000",
			name: "Иван",
			telegramId: 1,
			roles: [Role.ADMIN],
			createdAt: "2026-05-01T12:00",
		};
		await repo.save(user);

		const mod = new UserApiModule();
		mod.init({ userRepo: repo });

		const result = await mod.handle({
			name: "get-user",
			attrs: { uuid: user.uuid },
		});
		expect((result as User).name).toBe("Иван");
	});

	test("list-users: возвращает список", async () => {
		const repo = new UserInmemoryRepo();
		const user: User = {
			uuid: "550e8400-e29b-41d4-a716-446655440000",
			name: "Иван",
			telegramId: 1,
			roles: [Role.ADMIN],
			createdAt: "2026-05-01T12:00",
		};
		await repo.save(user);

		const mod = new UserApiModule();
		mod.init({ userRepo: repo });

		const result = await mod.handle({
			name: "list-users",
			attrs: {},
		});
		expect(result as User[]).toHaveLength(1);
	});

	test("get-user-by-telegram-id: находит пользователя", async () => {
		const repo = new UserInmemoryRepo();
		const user: User = {
			uuid: "550e8400-e29b-41d4-a716-446655440000",
			name: "Иван",
			telegramId: 12345,
			roles: [Role.ADMIN],
			createdAt: "2026-05-01T12:00",
		};
		await repo.save(user);

		const mod = new UserApiModule();
		mod.init({ userRepo: repo });

		const result = await mod.handle({
			name: "get-user-by-telegram-id",
			attrs: { telegramId: 12345 },
		});
		expect((result as User).name).toBe("Иван");
	});

	test("неизвестная команда — ошибка", async () => {
		const mod = new UserApiModule();
		mod.init({ userRepo: new UserInmemoryRepo() });

		await expect(mod.handle({ name: "unknown", attrs: {} })).rejects.toThrow(
			"Команда 'unknown' не найдена",
		);
	});
});
```
