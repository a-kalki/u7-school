# Агрегат (Aggregate)

## Назначение

Файл `domain/<entity>/a-root.ts` содержит класс агрегата — богатый доменный объект, инкапсулирующий состояние и бизнес-логику изменений.

## Правила

1. Наследуется от `Aggregate<ArMeta>` из `@u7/core`.
1. Принимает состояние через конструктор и проверяет инварианты через схему.
1. Можно расширить проверку инвариантов с дополнительной логикой, не покрываемой валидационной схемой.
1. Содержит **только** фабричные методы создания и методы изменения состояния.
1. Не содержит схему валидации — импортирует её из `entity.ts`.
1. Не обращается к репозиторию, БД и внешним сервисам.

## Состояние и мутации

### `state` — иммутабельный геттер (для внешнего чтения)
Возвращает `structuredClone` состояния. Внешний код не может изменить состояние агрегата.

### `_state` — мутабельный геттер (для внутренних методов)
Возвращает прямую ссылку на `#state`. **Разрешён** только внутри методов агрегата.
Позволяет напрямую мутировать состояние без иммутабельных копирований.

После прямых мутаций нужно вызвать `this.safeUpdate({})` — это обновит `updatedAt` и запустит валидацию.

```typescript
addModule(command: AddModuleCmd): void {
  const module: Module = { ... };
  // Прямая мутация через _state:
  (this._state as Course & { kind: "modules" }).modules.push(module);
  // Триггер обновления updatedAt:
  this.safeUpdate({});
}
```

**Зачем разрешена прямая мутация:** агрегат не используется для рендеринга
и других реакционных действий, поэтому иммутабельные обновления не нужны.

### `updateState(newState)` — полная замена состояния
Валидирует новое состояние и **автоматически устанавливает `updatedAt = isoNow()`**.

### `safeUpdate(partial)` — частичное обновление
Обновляет только поля со значением не `undefined`. Поля из `safeAttrs` (`uuid`, `createdAt`) не перезаписываются.
`updatedAt` устанавливается автоматически.

## createdAt / updatedAt

- `createdAt` и `updatedAt` — поля **только агрегата** (корня).
- Value-objects (Module, Project) внутри агрегата **не имеют** `createdAt`/`updatedAt`.
- `updateState` и `safeUpdate` автоматически обновляют `updatedAt` агрегата.
- `safeUpdate({})` с пустым объектом используется как триггер обновления `updatedAt` после прямых мутаций.

## Ошибки консистентности данных

Если метод, возвращающий данные (например `getLessons`), не может найти ожидаемый объект —
это ошибка консистентности данных, нужно выбрасывать `throwBadRequest`.
**Нельзя молча возвращать пустой массив/undefined** — это маскирует баги.

```typescript
getLessons(projectId: string): string[] {
  const project = this.getProject(projectId);
  if (!project) {
    this.throwBadRequest("Проект не найден в курсе");
  }
  return project.lessonIds;
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

```typescript
import { Aggregate, isoNow } from "@u7/core";
import type { CreateUserCmd } from "./commands/create-user-cmd";
import type { User, UserArMeta } from "./entity";
import { UserSchema } from "./entity";

export class UserAr extends Aggregate<UserArMeta> {
  constructor(state: User) {
    super(state, UserSchema);
  }

  static create(command: CreateUserCmd): UserAr {
    const candidate: User = {
      uuid: crypto.randomUUID(),
      name: command.name,
      telegramId: command.telegramId,
      roles: command.roles,
      createdAt: isoNow(),
    };
    return new UserAr(candidate);
  }

  addRole(role: Role): void {
    if (this.state.roles.includes(role)) return;
    this._state.roles.push(role);
    this.safeUpdate({});
  }
}
```

## Тестирование

1. Тестирование инвариантов (схемы валидации) — проверка что схема подключена.
1. Обязательны тесты для проверки инвариантов с дополнительной логикой.
1. Каждый метод покрывается тестом (кроме очевидных с простой логикой).
1. Группируй тесты на втором уровне по тестируемым методам.
1. Тестируй граничные случаи, неудачные сценарии.
1. Не выходи за пределы ответственности объекта.
1. Выноси повторяющуюся логику в хелперы.
1. Тест — не более 10 строк кода, краткий и понятный.

```typescript
import { describe, expect, test } from "bun:test";
import { UserAr } from "./a-root";
import { Role } from "./roles";

const validUser = {
  uuid: "550e8400-e29b-41d4-a716-446655440000",
  name: "Иван",
  telegramId: 123,
  roles: [Role.ADMIN],
  createdAt: "2026-05-01T12:00",
};

describe("UserAr", () => {
  describe("create", () => {
    test("генерирует UUID и createdAt", () => {
      const ar = UserAr.create({ name: "А", telegramId: 1, roles: [Role.STUDENT] });
      expect(ar.state.uuid).toMatch(/^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$/i);
      expect(ar.state.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    });

    test("не создаёт updatedAt при создании", () => {
      const ar = UserAr.create({ name: "А", telegramId: 1, roles: [Role.STUDENT] });
      expect(ar.state.updatedAt).toBeUndefined();
    });
  });

  describe("addRole", () => {
    test("добавляет роль и обновляет updatedAt", () => {
      const ar = new UserAr(validUser);
      ar.addRole(Role.STUDENT);
      expect(ar.state.roles).toContain(Role.STUDENT);
      expect(ar.state.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    });
  });
});
```
