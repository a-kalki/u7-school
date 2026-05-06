# Агрегат (Aggregate)

## Назначение

Файл `domain/<entity>/a-root.ts` содержит класс агрегата — богатый доменный объект, инкапсулирующий состояние и бизнес-логику изменений.

## Правила

1. Наследуется от `Aggregate<ArMeta>` из `@u7/core`.
1. Принимает состояние через конструктор и проверяет инварианты через схему.
1. Можно расширить проверку инвариантов с дополнительной логикой не покрываемых валидационной схемой.
1. Содержит **только** фабричные методы создания и методы изменения состояния.
1. Не содержит схему валидации — импортирует её из `entity.ts`.
1. Не обращается к репозиторию, БД и внешним сервисам.

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
		if (this.state.roles.includes(role)) {
			return;
		}
		
		const updatedUser = {
			...this.state,
			roles: [...this.state.roles, role],
			updatedAt: isoNow(),
		};
		
		this.updateState(updatedUser);
	}
}
```

## Тестирование

1. Тестирование инвариантов (схемы валидации) как правило одна, для проверки что схема подключена.
1. Обязательны тесты для проверки инвариантов с дополнительной логикой.
1. Каждый метод как правило покрывается тестом. Исключение: только очевидные методы с простой логикой.
1. Если тестов много, то группируй тесты на втором уровне по тестируемым методам.
1. Не ограничивайся удачным сценарием. Пиши тесты для граничных случаев, неудачных сценариев, задавай вопрос "А что если ...?".
1. Но не выходи в тестах за пределы ответственности объекта.
1. Помни, в пирамиде тестов доменные объекты должны иметь самое лучшее покрытие различных поведенческих случаев.
1. Выноси повторяющуюся логику в хелперы.
1. Стремись чтобы каждый тест был не более 10 строк кода, пусть тест будет кратким и понятным.

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
  describe("constructor", () => {
    test("создаётся из существующего состояния", () => {
      const ar = new UserAr(validUser);
      expect(ar.state).toEqual(validUser);
    });

    test("нарушение инвариантов выбрасывает ошибку", () => {
      expect(() => new UserAr({ ...validUser, name: "" })).toThrow(
        "Нарушены инварианты агрегата",
      );
    });

    test("нарушение инвариантов с несколькими ошибками", () => {
      const invalid = {
        ...validUser,
        uuid: "bad",
        name: "",
        telegramId: -5,
        roles: [],
      };
      expect(() => new UserAr(invalid)).toThrow("Нарушены инварианты агрегата");
    });
  });

  describe("create", () => {
    test("генерирует UUID и createdAt", () => {
      const ar = UserAr.create({
        name: "А",
        telegramId: 1,
        roles: [Role.STUDENT],
      });
      expect(ar.state.uuid).toBeString();
      expect(ar.state.uuid).toMatch(
        /^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$/i,
      );
      expect(ar.state.createdAt).toBeString();
      expect(ar.state.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    });

    test("сохраняет переданные поля", () => {
      const ar = UserAr.create({
        name: "Петр",
        telegramId: 456,
        roles: [Role.MENTOR, Role.ADMIN],
      });
      expect(ar.state.name).toBe("Петр");
      expect(ar.state.telegramId).toBe(456);
      expect(ar.state.roles).toEqual([Role.MENTOR, Role.ADMIN]);
    });

    test("не создаёт updatedAt при создании", () => {
      const ar = UserAr.create({
        name: "А",
        telegramId: 1,
        roles: [Role.STUDENT],
      });
      expect(ar.state.updatedAt).toBeUndefined();
    });
  });

	describe("addRole", () => {
		test("добавляет новую роль", () => {
			const ar = new UserAr({
				...validUser,
				roles: [Role.STUDENT],
			});
			
			ar.addRole(Role.MENTOR);
			
			expect(ar.state.roles).toContain(Role.MENTOR);
			expect(ar.state.roles).toHaveLength(2);
		});

		test("не добавляет дублирующуюся роль", () => {
			const ar = new UserAr({
				...validUser,
				roles: [Role.STUDENT, Role.MENTOR],
			});
			
			ar.addRole(Role.STUDENT);
			
			expect(ar.state.roles).toEqual([Role.STUDENT, Role.MENTOR]);
		});

		test("добавляет роль к пустому массиву ролей", () => {
			const ar = new UserAr({
				...validUser,
				roles: [],
			});
			
			ar.addRole(Role.STUDENT);
			
			expect(ar.state.roles).toEqual([Role.STUDENT]);
		});

		test("обновляет updatedAt при добавлении роли", () => {
			const ar = new UserAr(validUser);
			const oldUpdatedAt = ar.state.updatedAt;
			
			ar.addRole(Role.STUDENT);
			
			expect(ar.state.updatedAt).toBeDefined();
			expect(ar.state.updatedAt).not.toBe(oldUpdatedAt);
			expect(ar.state.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
		});

		test("сохраняет существующие роли при добавлении новой", () => {
			const ar = new UserAr({
				...validUser,
				roles: [Role.STUDENT],
			});
			
			ar.addRole(Role.MENTOR);
			
			expect(ar.state.roles).toContain(Role.STUDENT);
			expect(ar.state.roles).toContain(Role.MENTOR);
		});

		test("последовательно добавляет несколько ролей", () => {
			const ar = new UserAr({
				...validUser,
				roles: [Role.STUDENT],
			});
			
			ar.addRole(Role.MENTOR);
			ar.addRole(Role.ADMIN);
			
			expect(ar.state.roles).toEqual([Role.STUDENT, Role.MENTOR, Role.ADMIN]);
		});

		test("не добавляет роль, если она уже есть (даже если есть другие)", () => {
			const ar = new UserAr({
				...validUser,
				roles: [Role.STUDENT, Role.MENTOR],
			});
			
			ar.addRole(Role.MENTOR);
			
			expect(ar.state.roles).toEqual([Role.STUDENT, Role.MENTOR]);
		});

		test("выбрасывает ошибку при попытке добавить роль к невалидному состоянию", () => {
			// Создаём валидный агрегат
			const ar = UserAr.create({ 
				name: "А", 
				telegramId: 1, 
				roles: [Role.STUDENT] 
			});
			
			// "Взламываем" состояние, делая его невалидным
			(ar as any).state.name = "";
			
			expect(() => ar.addRole(Role.MENTOR))
				.toThrow("Нарушены инварианты агрегата");
		});
	}););
