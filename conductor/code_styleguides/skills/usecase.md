# Сценарий использования (UseCase)

## Назначение

Файл `api/<entity>/<uc-name>-uc.ts` содержит класс UC — оркестратор одной бизнес-операции. Наследуется от `UseCase<CmdMeta, Resolver>`.

## Правила

1. В основном класс опирается на каркас и поток определённый родителем, концентрируясь на «личной» доменной логике.
1. Старайся разбивать логику на логические шаги, делай методы небольшими, но пользуйся разумностью.
1. Концентрируйся на положительном потоке, если происходит прогнозируемая ошибка — прерывай поток, передав ошибку предусмотренными методами.
1. **CmdMeta.errors должен содержать ВСЕ ошибки**, которые могут быть выброшены в usecase (включая ошибки от `getActor()`, `throwAccessDenied()`, `getCourse()` и других хелперов базового класса). Система типов не проверяет это автоматически — ответственность разработчика/агента.
1. **Проверка прав доступа** выполняется инлайн в методе `execute()` — с помощью `this.getActor()`, `Policy.canXxx()` и `this.throwAccessDenied()`.

## Поля UseCase

| Поле | Назначение | Пример |
|---|---|---|
| `ucName` | Уникальное имя (kebab-case) | `"create-course"` |
| `ucLabel` | Человекочитаемая метка | `"Создать курс"` |
| `arMeta` | Метаданные агрегата | `{ arName: "Course", arLabel: "Курс" }` |
| `type` | Тип: `"command"` или `"query"` | `"command"` |
| `requiresAuth` | Требуется ли авторизация | `true` |
| `inputSchema` | Valibot-схема входных данных | `CreateCourseCmdSchema` |
| `outputSchema` | Valibot-схема выходных данных | `CourseSchema` |

## UcMeta (CmdMeta)

```typescript
export interface CreateCourseCmdMeta {
  ucName: "create-course";          // было commandName
  arMeta: CourseArMeta;
  input: CreateCourseCmd;
  output: Course;
  errors: CreateCourseCmdError;
  requiresAuth: true;
  type: "command";
}
```

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

### Хелперы базового класса модуля

Как правило, каждый модуль предоставляет свой базовый UC с хелперами:

```typescript
// Базовый UC модуля (например, UserUseCase)
export abstract class UserUseCase<TMeta extends UcMeta> extends UseCase<TMeta, UserApiModuleResolver> {
  /** Получить пользователя (возвращает undefined если не найден) */
  protected async getUser(userId: string): Promise<User | undefined> { ... }

  /** Получить актора с проверкой существования (бросает если не найден) */
  protected async getActor(actorId: string): Promise<User> { ... }

  /** Выбросить ошибку доступа */
  protected throwAccessDenied(message?: string): never { ... }
}
```

### Реализация конкретного usecase

```typescript
import { type AuthError, errConflict, errUnauthorized } from "@u7/core/domain";
import { UserAr } from "../../domain/user/a-root";
import {
  type CreateUserCmd,
  type CreateUserCmdMeta,
  CreateUserCmdSchema,
} from "../../domain/user/commands/create-user-cmd";
import type {
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
 */
export class CreateUserUc extends UserUseCase<CreateUserCmdMeta> {
  protected readonly ucName = "create-user" as const;
  protected readonly ucLabel = "Создать пользователя" as const;
  protected readonly arMeta = { arName: UserAr.arName() as "User", arLabel: UserAr.arLabel() as "Пользователь" };
  protected readonly type = "command" as const;
  protected readonly requiresAuth = false as const;
  protected readonly inputSchema = CreateUserCmdSchema;
  protected readonly outputSchema = UserSchema;

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
        this.throwBaseErrors(
          errUnauthorized<AuthError>(
            "UNAUTHORIZED_ERROR",
            "Требуется авторизация",
          ),
        );
      }
      const actor = await this.getActor(actorId);
      if (!UserPolicy.canCreate(actor)) {
        this.throwAccessDenied(
          "Недостаточно прав для создания пользователя",
        );
      }
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
