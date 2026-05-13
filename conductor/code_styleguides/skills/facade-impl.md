# Реализация фасада (Facade Implementation)

## Назначение

Файл `infra/<имя>-facade.ts` содержит реализацию интерфейса фасада. Реализация находится в infra-слое того модуля, который она представляет.

## Правила

1. Реализация фасада размещается в `infra/` того же модуля, что и интерфейс (например, `UserInProcFacade` — в `@u7/user/infra`).
2. Реализация экспортируется из `infra/index.ts` пакета.
3. InProc-реализация использует `ApiModule` для вызова use-case'ов (внутрипроцессный вызов).
4. Конструктор принимает зависимости, необходимые для работы (например, `UserApiModule`).

## Пример

```typescript
// packages/user/src/infra/user-in-proc-facade.ts
import type { UserApiModule } from "#api/module";
import type { User } from "#domain/user/entity";
import type { UserFacade } from "#domain/facade";

/**
 * In-process реализация фасада пользователей.
 * Принимает UserApiModule и делегирует вызовы его API.
 */
export class UserInProcFacade implements UserFacade {
  readonly #userApi: UserApiModule;

  constructor(userApi: UserApiModule) {
    this.#userApi = userApi;
  }

  async getUserByUuid(
    uuid: string,
    actorId?: string,
  ): Promise<User | undefined> {
    try {
      const result = await this.#userApi.handle({
        name: "get-user",
        attrs: { uuid },
        actorId,
      });
      return result as User;
    } catch {
      return undefined;
    }
  }

  async userExists(uuid: string, actorId?: string): Promise<boolean> {
    const user = await this.getUserByUuid(uuid, actorId);
    return user !== undefined;
  }
}
```

## Подключение в приложении

```typescript
// apps/cli/src/main.ts
import { UserApiModule } from "@u7/user/api";
import { UserInProcFacade } from "@u7/user/infra";
import { CourseApiModule } from "@u7/course/api";

const userApiModule = new UserApiModule();
userApiModule.init({ userRepo: new UserJsonRepo() });

// Создаём фасад, передавая ApiModule
const userFacade = new UserInProcFacade(userApiModule);

const courseApiModule = new CourseApiModule();
courseApiModule.init({
  courseRepo: new CourseJsonRepo(),
  userFacade, // фасад передаётся как зависимость
});
```
