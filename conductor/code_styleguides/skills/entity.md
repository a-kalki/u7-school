# Сущность (Entity)

## Назначение

Файл `domain/<entity>/entity.ts` — единственный источник истины для структуры данных предметной области. Содержит:
- **Схему валидации** (`<EntityName>Schema`) на базе Valibot.
- **Тип сущности** (`<EntityName>`), выведенный из схемы.
- **Метаданные агрегата** (`<EntityName>ArMeta`) — контракт для класса агрегата.

## Правила

1. Все поля сущности обязаны иметь валидацию через Valibot.
1. Тип сущности выводится из валидационой схемы.
1. В этом же файле объявляется мета тип агрегата `<Name>ArMeta`.
1. В `Meta` должны быть только ошибки выбрасываемые самим агрегатом;
1. Не размещайте бизнес-логику — только структуру и валидацию.

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
import * as v from "valibot";
import { RoleSchema } from "./roles";

export const UserSchema = v.object({
	uuid: v.pipe(v.string(), v.uuid("Некорректный формат UUID")),
	name: v.pipe(v.string(), v.trim(), v.nonEmpty("Имя не может быть пустым")),
	telegramId: v.pipe(
		v.number(),
		v.integer("telegramId должен быть целым числом"),
		v.minValue(1, "telegramId должен быть положительным"),
	),
	roles: v.pipe(
		v.array(RoleSchema),
		v.minLength(1, "Пользователь должен иметь хотя бы одну роль"),
	),
	createdAt: v.pipe(v.string(), v.isoDateTime("Некорректный формат даты")),
	updatedAt: v.optional(
		v.pipe(v.string(), v.isoDateTime("Некорректный формат даты")),
	),
});

export type User = v.InferOutput<typeof UserSchema>;

const { createdAt, updatedAt, ...UserOutEntries } = UserSchema.entries;
export const UserOutSchema = v.object(UserOutEntries);
export type UserOut = v.InferOutput<typeof UserOutSchema>;

export interface UserArMeta {
	name: "user";
	label: "Пользователь";
	state: User;
}
```

## Тестирование

1. Тестирование схемы валидации должна быть исключительно полной, другие объекты доверяются на достоверность состояния сущности.
1. Если тестов много, то группировать тесты на втором уровне по тестируемым свойствам.
1. Не ограничивайся удачным сценарием. Пиши тесты для граничных случаев, неудачных сценариев, задавай вопрос "А что если ...?".
1. Но не выходи в тестах за пределы ответственности объекта.
1. Помни, в пирамиде тестов доменные объекты должны иметь самое лучшее покрытие различных поведенческих случаев.

```typescript
import { describe, expect, test } from "bun:test";
import * as v from "valibot";
import { UserSchema } from "./entity";
import { Role } from "./roles";

describe("Схема пользователя", () => {
  const valid = {
    uuid: "550e8400-e29b-41d4-a716-446655440000",
    name: "Иван",
    telegramId: 123,
    roles: [Role.STUDENT],
    createdAt: "2026-05-01T12:00",
    updatedAt: "2026-05-01T13:00",
  };

  test("принимает валидного пользователя", () => {
    const result = v.safeParse(UserSchema, valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.output).toMatchObject(valid);
    }
  });

  describe("поле uuid", () => {
    test("принимает корректный UUID v4", () => {
      const uuids = [
        "550e8400-e29b-41d4-a716-446655440000",
        "123e4567-e89b-12d3-a456-426614174000",
        "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      ];
      uuids.forEach((uuid) => {
        const result = v.safeParse(UserSchema, { ...valid, uuid });
        expect(result.success).toBe(true);
      });
    });

    test("отклоняет невалидный UUID", () => {
      const invalidUuids = [
        "bad",
        "550e8400-e29b-41d4-a716", // слишком короткий
        "550e8400-e29b-41d4-a716-4466554400001", // слишком длинный
        "550e8400-e29b-41d4-a716-44665544000g", // не hex символ
        "550e8400e29b41d4a716446655440000", // без дефисов
        "",
        " ",
      ];
      invalidUuids.forEach((uuid) => {
        const result = v.safeParse(UserSchema, { ...valid, uuid });
        expect(result.success).toBe(false);
      });
    });

    test("отклоняет отсутствующее поле uuid", () => {
      const { uuid, ...withoutUuid } = valid;
      const result = v.safeParse(UserSchema, withoutUuid);
      expect(result.success).toBe(false);
    });
  });

  describe("поле name", () => {
    test("принимает непустую строку", () => {
      const names = ["Иван", "John", "Марія", "张三", "A"];
      names.forEach((name) => {
        const result = v.safeParse(UserSchema, { ...valid, name });
        expect(result.success).toBe(true);
      });
    });

    test("отклоняет пустую строку", () => {
      const emptyNames = ["", " ", "  "];
      emptyNames.forEach((name) => {
        const result = v.safeParse(UserSchema, { ...valid, name });
        expect(result.success).toBe(false);
      });
    });

    test("отклоняет отсутствующее поле name", () => {
      const { name, ...withoutName } = valid;
      const result = v.safeParse(UserSchema, withoutName);
      expect(result.success).toBe(false);
    });

    test("отклоняет name не строкового типа", () => {
      const invalidTypes = [123, true, null, undefined, [], {}];
      invalidTypes.forEach((name) => {
        const result = v.safeParse(UserSchema, { ...valid, name });
        expect(result.success).toBe(false);
      });
    });
  });

  describe("поле telegramId", () => {
    test("принимает положительное целое число", () => {
      const ids = [1, 100, 999999, 123456789];
      ids.forEach((telegramId) => {
        const result = v.safeParse(UserSchema, { ...valid, telegramId });
        expect(result.success).toBe(true);
      });
    });

    test("отклоняет отрицательные числа", () => {
      const negativeIds = [-1, -100, -0];
      negativeIds.forEach((telegramId) => {
        const result = v.safeParse(UserSchema, { ...valid, telegramId });
        expect(result.success).toBe(false);
      });
    });

    test("отклоняет ноль", () => {
      const result = v.safeParse(UserSchema, { ...valid, telegramId: 0 });
      expect(result.success).toBe(false);
    });

    test("отклоняет нецелые числа", () => {
      const floats = [1.5, 2.001, 123.456];
      floats.forEach((telegramId) => {
        const result = v.safeParse(UserSchema, { ...valid, telegramId });
        expect(result.success).toBe(false);
      });
    });

    test("отклоняет отсутствующее поле telegramId", () => {
      const { telegramId, ...withoutTelegramId } = valid;
      const result = v.safeParse(UserSchema, withoutTelegramId);
      expect(result.success).toBe(false);
    });

    test("отклоняет telegramId не числового типа", () => {
      const invalidTypes = ["123", true, null, undefined, [], {}];
      invalidTypes.forEach((telegramId) => {
        const result = v.safeParse(UserSchema, { ...valid, telegramId });
        expect(result.success).toBe(false);
      });
    });
  });

  describe("поле roles", () => {
    test("принимает массив с одной ролью", () => {
      const result = v.safeParse(UserSchema, {
        ...valid,
        roles: [Role.STUDENT],
      });
      expect(result.success).toBe(true);
    });

    test("принимает массив с несколькими ролями", () => {
      const result = v.safeParse(UserSchema, {
        ...valid,
        roles: [Role.STUDENT, Role.MENTOR, Role.ADMIN],
      });
      expect(result.success).toBe(true);
    });

    test("отклоняет пустой массив", () => {
      const result = v.safeParse(UserSchema, { ...valid, roles: [] });
      expect(result.success).toBe(false);
    });

    test("отклоняет отсутствующее поле roles", () => {
      const { roles, ...withoutRoles } = valid;
      const result = v.safeParse(UserSchema, withoutRoles);
      expect(result.success).toBe(false);
    });

    test("отклоняет roles не массивом", () => {
      const invalidTypes = ["STUDENT", 123, true, null, undefined, {}];
      invalidTypes.forEach((roles) => {
        const result = v.safeParse(UserSchema, { ...valid, roles });
        expect(result.success).toBe(false);
      });
    });

    test("отклоняет массив с некорректными значениями ролей", () => {
      const invalidRolesArrays = [
        ["INVALID_ROLE"],
        [Role.STUDENT, "INVALID"],
        [123],
        [null],
      ];
      invalidRolesArrays.forEach((roles) => {
        const result = v.safeParse(UserSchema, { ...valid, roles });
        expect(result.success).toBe(false);
      });
    });
  });

  describe("поле createdAt", () => {
    test("принимает корректный ISO дату и время (без миллисекунд)", () => {
      const validDates = [
        "2026-05-01T12:00",
        "2024-01-01T00:00",
        "2023-12-31T23:59",
        "2025-06-15T08:30",
      ];
      validDates.forEach((createdAt) => {
        const result = v.safeParse(UserSchema, { ...valid, createdAt });
        expect(result.success).toBe(true);
      });
    });

    test("отклоняет некорректный формат даты", () => {
      const invalidDates = [
        "2026-05-01T12:00:00.000Z", // с миллисекундами и Z
        "2026-05-01", // только дата
        "01.05.2026",
        "invalid-date",
        "",
        " ",
        "2026-13-01T12:00", // неверный месяц
        "2026-05-32T12:00", // неверный день
      ];
      invalidDates.forEach((createdAt) => {
        const result = v.safeParse(UserSchema, { ...valid, createdAt });
        expect(result.success).toBe(false);
      });
    });

    test("отклоняет отсутствующее поле createdAt", () => {
      const { createdAt, ...withoutCreatedAt } = valid;
      const result = v.safeParse(UserSchema, withoutCreatedAt);
      expect(result.success).toBe(false);
    });
  });

  describe("поле updatedAt", () => {
    test("принимает корректный ISO дату и время", () => {
      const validDates = [
        "2026-05-01T12:00",
        "2024-01-01T00:00",
        "2023-12-31T23:59",
      ];
      validDates.forEach((updatedAt) => {
        const result = v.safeParse(UserSchema, { ...valid, updatedAt });
        expect(result.success).toBe(true);
      });
    });

    test("принимает отсутствующее поле updatedAt (опционально)", () => {
      const { updatedAt, ...withoutUpdatedAt } = valid;
      const result = v.safeParse(UserSchema, withoutUpdatedAt);
      expect(result.success).toBe(true);
    });

    test("отклоняет некорректный формат даты", () => {
      const invalidDates = [
        "2026-05-01",
        "invalid-date",
        "2023-12-31T23:59:59.999Z", // с миллисекундами и Z
      ];
      invalidDates.forEach((updatedAt) => {
        const result = v.safeParse(UserSchema, { ...valid, updatedAt });
        expect(result.success).toBe(false);
      });
    });
  });

  describe("комбинации нескольких невалидных полей", () => {
    test("отклоняет при нескольких ошибках одновременно", () => {
      const invalid = {
        ...valid,
        uuid: "bad",
        name: "",
        telegramId: -5,
        roles: [],
        createdAt: "invalid",
      };
      const result = v.safeParse(UserSchema, invalid);
      expect(result.success).toBe(false);
    });
  });
});
```
