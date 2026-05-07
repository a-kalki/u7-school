# Сценарий использования (UseCase)

## Назначение

Файл `api/<command-name>-uc.ts` содержит класс UC — оркестратор одной бизнес-операции. Наследуется от `UseCase<CmdMeta, Resolver>`.

## Правила

1. В основном класс опирается на каркас и поток определенный родителем концентрируясь на "личной" доменной логике.
1. Старайся разбивать логику на логические шаги, делай методы не большими но пользуйся в этом разумностью.
1. Концентрируйся на положительном потоке, если происходит прогнозируемая ошибка в потоке обработки, прерывай поток передав ошибку предусмотренным методам.

## Инструкция по предотвращению регресса

### При дополнении или рефакторинге кода/тестов:
- **Не допускай регресса** — не ломай существующее корректное поведение
- **Меняй только то, что относится к текущей задаче** — не трогай несвязанные модули и тесты
- **Не удаляй и не переписывай существующие тесты** — только добавляй новые

### При обнаружении критических ошибок вне текущей задачи:
- **Запроси изменения** — опиши проблему и предложи исправление, дождись разрешения
- **Либо задокументируй в отчёте** — укажи ошибку по окончанию задачи
- **Не исправляй без согласования** — ошибка не должна быть исправлена как часть текущей задачи если на нее нет очевидных причин

## Пример

```typescript
import { errAccessDenied, errConflict } from "@u7/core";
import { UserAr } from "../../domain/user/a-root";
import {
  type CreateUserCmd,
  type CreateUserCmdMeta,
  CreateUserCmdSchema,
} from "../../domain/user/commands/create-user-cmd";
import type {
  AccessDeniedUcError,
  BootstrapRequiresAdminUcError,
  TelegramIdTakenUcError,
} from "../../domain/user/commands/errors";
import type { User } from "../../domain/user/entity";
import { UserSchema } from "../../domain/user/entity";
import { UserPolicy } from "../../domain/user/policy";
import { Role } from "../../domain/user/roles";
import { UserUseCase } from "../user-uc";

/**
 * Use-case создания пользователя.
 * Требует прав ADMIN (кроме bootstrap — первый пользователь при пустом репозитории,
 * но даже в bootstrap первый пользователь обязан иметь роль ADMIN в команде).
 */
export class CreateUserUc extends UserUseCase<CreateUserCmdMeta> {
  protected readonly commandName = "create-user" as const;
  protected readonly description = "Создать пользователя" as const;
  protected readonly arName = "user" as const;
  protected readonly arLabel = "Пользователь" as const;
  protected readonly type = "command" as const;
  protected readonly requiresAuth = false as const;
  protected readonly inputSchema = CreateUserCmdSchema;
  protected readonly outputSchema = UserSchema;

  /**
   * Проверка прав на создание пользователя.
   * Только ADMIN может создавать пользователей.
   */
  protected override async checkPolicy(
    _command: CreateUserCmd,
    actor: User,
  ): Promise<void> {
    if (!UserPolicy.canCreate(actor)) {
      this.throwError(
        errAccessDenied<AccessDeniedUcError>(
          "ACCESS_DENIED",
          "Недостаточно прав для создания пользователя",
          undefined,
        ),
      );
    }
  }

  async execute(command: CreateUserCmd, actorId?: string): Promise<User> {
    const repo = this.resolve.userRepo;
    const isEmpty = await repo.isEmpty();

    if (isEmpty) {
      // Bootstrap: первый пользователь обязан иметь роль ADMIN
      if (!command.roles.includes(Role.ADMIN)) {
        this.throwError(
          errConflict<BootstrapRequiresAdminUcError>(
            "BOOTSTRAP_REQUIRES_ADMIN",
            "Первый пользователь должен иметь роль ADMIN",
            undefined,
          ),
        );
      }
    } else {
      // Репозиторий не пуст — требуется авторизованный ADMIN
      if (!actorId) {
        this.throwError(
          errAccessDenied<AccessDeniedUcError>(
            "ACCESS_DENIED",
            "Требуется авторизация для создания пользователя",
            undefined,
          ),
        );
      }
      const actor = await this.getUser(actorId);
      await this.checkPolicy(command, actor);
    }

    // Проверка уникальности telegramId
    if (await repo.isTelegramIdTaken(command.telegramId)) {
      this.throwError(
        errConflict<TelegramIdTakenUcError>(
          "TELEGRAM_ID_TAKEN",
          "Пользователь с таким telegramId уже существует",
          { telegramId: command.telegramId },
        ),
      );
    }

    const ar = UserAr.create(command);
    await repo.save(ar.state);

    return ar.state;
  }
}
```

## Тестирование

1. Концентрируйся на тестировании функционала usecase, считай что доменные объекты уже протестированы.
1. Тестируй все ветки потока выполнения, гарантируй через тесты в корректной работе usecase.
1. Если тестов много, то группируй тесты на втором уровне по "SUCCESS", "FAIL".
1. Не ограничивайся удачным сценарием. Пиши тесты для граничных случаев, неудачных сценариев, задавай вопрос "А что если ...?".
1. Но не выходи в тестах за пределы ответственности объекта.
1. Делай моки всех инфраструктурных объектов (репозитории, фасад), не импортируй их.
1. Выноси повторяющуюся логику в хелперы.
1. Стремись чтобы каждый тест был не более 10 строк кода, пусть тест будет кратким и понятным.

```typescript
import { describe, expect, mock, test } from "bun:test";
import type { User } from "../../domain/user/entity";
import type { UserRepo } from "../../domain/user/repo";
import { Role } from "../../domain/user/roles";
import { CreateUserUc } from "./create-user-uc";

/**
 * Хелпер: создаёт мок-репозиторий и usecase.
 * Моки лежат в переменных, через них настраивается поведение в каждом тесте.
 */
function setupUc() {
  const save = mock(async (_user: User): Promise<void> => { });
  const getByUuid = mock(
    async (_uuid: string): Promise<User | undefined> => undefined,
  );
  const getByTelegramId = mock(
    async (_id: number): Promise<User | undefined> => undefined,
  );
  const getAll = mock(async (): Promise<User[]> => []);
  const isTelegramIdTaken = mock(
    async (_id: number): Promise<boolean> => false,
  );
  const isEmpty = mock(async (): Promise<boolean> => true);

  const repo: UserRepo = {
    save,
    getByUuid,
    getByTelegramId,
    getAll,
    isTelegramIdTaken,
    isEmpty,
  };
  const uc = new CreateUserUc();
  uc.init({ userRepo: repo });

  return {
    save,
    getByUuid,
    getByTelegramId,
    getAll,
    isTelegramIdTaken,
    isEmpty,
    repo,
    uc,
  };
}

function makeUser(overrides: Partial<User> = {}): User {
  return {
    uuid: crypto.randomUUID(),
    name: "Тест",
    telegramId: 1,
    roles: [Role.ADMIN],
    createdAt: "2026-05-01T12:00",
    ...overrides,
  };
}

describe("CreateUserUc", () => {
  describe("SUCCESS", () => {
    test("бутстрап: создаёт первого пользователя с ролью ADMIN без актора", async () => {
      const { isEmpty, save, uc } = setupUc();
      isEmpty.mockResolvedValue(true);

      const user = await uc.handle({
        name: "Админ",
        telegramId: 1,
        roles: [Role.ADMIN],
      });

      expect(user.name).toBe("Админ");
      expect(user.roles).toEqual([Role.ADMIN]);
      expect(save).toHaveBeenCalledTimes(1);
    });

    test("второй пользователь сохраняет переданные роли", async () => {
      const { isEmpty, getByUuid, uc } = setupUc();
      const admin = makeUser();

      isEmpty.mockResolvedValueOnce(false);
      getByUuid.mockResolvedValueOnce(admin);
      const user = await uc.handle(
        { name: "Студент", telegramId: 2, roles: [Role.STUDENT] },
        admin.uuid,
      );

      expect(user.roles).toEqual([Role.STUDENT]);
    });

    test("ADMIN может создавать других пользователей", async () => {
      const { isEmpty, getByUuid, save, uc } = setupUc();
      const admin = makeUser();

      isEmpty.mockResolvedValueOnce(false);
      getByUuid.mockResolvedValueOnce(admin);

      const user = await uc.handle(
        { name: "Новый студент", telegramId: 2, roles: [Role.STUDENT] },
        admin.uuid,
      );

      expect(user.roles).toEqual([Role.STUDENT]);
      expect(user.name).toBe("Новый студент");
      expect(save).toHaveBeenCalledTimes(1);
    });
  });

  describe("FAIL", () => {
    test("бутстрап: отклоняет первого пользователя без роли ADMIN", async () => {
      const { isEmpty, uc } = setupUc();
      isEmpty.mockResolvedValue(true);

      await expect(
        uc.handle({ name: "Не админ", telegramId: 1, roles: [Role.STUDENT] }),
      ).rejects.toThrow("Первый пользователь должен иметь роль ADMIN");
    });

    test("отклоняет дубликат telegramId", async () => {
      const { isEmpty, getByUuid, isTelegramIdTaken, uc } = setupUc();
      const admin = makeUser();

      isEmpty.mockResolvedValueOnce(false);
      getByUuid.mockResolvedValueOnce(admin);
      isTelegramIdTaken.mockResolvedValueOnce(true);

      await expect(
        uc.handle(
          { name: "Б", telegramId: 1, roles: [Role.STUDENT] },
          admin.uuid,
        ),
      ).rejects.toThrow("Пользователь с таким telegramId уже существует");
    });

    test("отклоняет невалидную команду", async () => {
      const { uc } = setupUc();

      await expect(
        uc.handle({ name: "", telegramId: -1, roles: [] }),
      ).rejects.toThrow("Переданы некорректные данные");
    });

    test("отклоняет создание без авторизации при непустом репозитории", async () => {
      const { isEmpty, uc } = setupUc();

      isEmpty.mockResolvedValueOnce(false);

      await expect(
        uc.handle({ name: "Хакер", telegramId: 2, roles: [Role.ADMIN] }),
      ).rejects.toThrow("Требуется авторизация для создания пользователя");
    });

    test("отклоняет создание пользователем без прав ADMIN", async () => {
      const { isEmpty, getByUuid, uc } = setupUc();
      const student = makeUser({ roles: [Role.STUDENT], telegramId: 2 });

      isEmpty.mockResolvedValueOnce(false);
      getByUuid.mockResolvedValueOnce(student);

      await expect(
        uc.handle(
          { name: "Хакер", telegramId: 3, roles: [Role.ADMIN] },
          student.uuid,
        ),
      ).rejects.toThrow("Недостаточно прав для создания пользователя");
    });
  });
});
```
