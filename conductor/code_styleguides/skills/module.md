# Модуль

## Три уровня модуля

| Уровень | Класс/тип | Файл | Назначение |
|---|---|---|---|
| Domain | `UserApiModuleMeta`, `UserApiModuleResolver` | `domain/module.ts` | Типы: мета модуля и контракт зависимостей |
| API | `UserApiModule` | `api/module.ts` | Диспетчер: регистрация UC, роутинг команд |
| UI | `CliController` | `ui/cli-controller.ts` | Контроллер CLI, вызывает юзкейсы через `ApiApp` |

## Иерархия типов

```
AppMeta<TModules extends ApiModuleMeta<any>>
  └─ ApiModuleMeta<TUcMetas extends UcMeta>
       └─ UcMeta
```

- `AppMeta` — регистрирует список модулей приложения.
- `ApiModuleMeta` — регистрирует набор `UcMeta`, принадлежащих модулю.
- `ApiModule` проверяет на уровне типов, что все `useCases` соответствуют заявленным `UcMeta`.
- `ApiApp` предоставляет type-safe метод `execute(ucName, attrs, actorId)`, который автоматически находит нужный модуль и проверяет типы параметров и результата.

## Domain: module.ts

- `ApiModuleMeta` описывает контракт для модулей слоя `Api`.
- Каждый модуль описывает свой тип `Resolver`.
- `ApiModuleMeta` принимает дженерик `TUcMetas`, который объединяет все `UcMeta` модуля.

```typescript
import type { ApiModuleMeta } from "@u7/core/domain";
import type { UserRepo } from "./user/repo";

import type { CreateUserCmdMeta } from "./user/commands/create-user-cmd";
import type { GetUserCmdMeta } from "./user/commands/get-user-cmd";

export type UserUcMetas = CreateUserCmdMeta | GetUserCmdMeta;

export interface UserApiModuleMeta extends ApiModuleMeta<UserUcMetas> {
	name: "user";
	url: "/user";
}

export interface UserApiModuleResolver {
	userRepo: UserRepo;
}
```

## API: module.ts

- Каждый модуль получает `Resolver` через `init`.
- Модуль предоставляет `Resolver` всем дочерним заинтересованным объектам через механизм инициализации.
- В `ApiModule` регистрируются все `UseCase` модуля для обработки "своих" команд.
- Тип `useCases` строго соответствует `ApiModuleMeta`.

```typescript
import { ApiModule } from "@u7/core/api";
import { CreateUserUc } from "./create-user-uc";
import { GetUserUc } from "./get-user-uc";
import type { UserApiModuleMeta, UserApiModuleResolver } from "../domain/module";

export class UserApiModule extends ApiModule<
	UserApiModuleMeta,
	UserApiModuleResolver
> {
	readonly name = "user" as const;
	readonly useCases = [
		new CreateUserUc(),
		new GetUserUc(),
	];
}
```

## Сборка ApiApp

- `ApiApp` параметризуется `AppMeta`, который объединяет метаданные всех зарегистрированных модулей.
- Метод `execute` принимает только `ucName` (без явного имени модуля) — модуль находится автоматически.
- Типы `attrs` и возвращаемого значения выводятся из `UcMeta`.

```typescript
import { ApiApp } from "@u7/core/api";
import type { AppMeta } from "@u7/core/domain";
import { UserApiModule } from "@u7/user/api";
import type { UserApiModuleMeta } from "@u7/user/domain";

export interface MyAppMeta extends AppMeta<UserApiModuleMeta> {
	name: "my-app";
}

const app = new ApiApp<MyAppMeta>();
app.register(new UserApiModule());

// Type-safe вызов:
const result = await app.execute("create-user", { name: "Иван", telegramId: 1 });
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
import { UserJsonRepo } from "../infra/db/user-json-repo";
import { UserApiModule } from "./module";

describe("UserApiModule", () => {
	test("create-user: бутстрап создаёт ADMIN", async () => {
		const mod = new UserApiModule();
		mod.init({ userRepo: new UserJsonRepo() });

		const result = await mod.handle({
			name: "create-user",
			attrs: { name: "А", telegramId: 1, roles: [Role.STUDENT] },
		});
		expect((result as User).roles).toEqual([Role.ADMIN]);
	});

	test("get-user: возвращает пользователя", async () => {
		const repo = new UserJsonRepo();
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

	test("неизвестная команда — ошибка", async () => {
		const mod = new UserApiModule();
		mod.init({ userRepo: new UserJsonRepo() });

		await expect(mod.handle({ name: "unknown", attrs: {} })).rejects.toThrow(
			"Команда 'unknown' не найдена",
		);
	});
});
```
