# Enum (перечисления)

## Назначение

Файл `domain/<entity>/<enum-name>.ts` содержит enum внутренних объектов сущности (например  `Role`, `Phone`) и Valibot-схему для их валидации. Перечисления — часть доменной модели, относящаяся к сущности.

## Правила

1. Используйте `enum` для определения ролей — это даёт автодополнение и type-safety.
2. Создавайте `*Schema` для валидации через `v.picklist`.
3. Размещайте документацию ролей в JSDoc комментариях.
4. Если роли несложны — рассмотрите включение его в файл `entity.ts`.

## Пример

```typescript
import * as v from "valibot";

/**
 * Роли пользователей платформы.
 * - STUDENT: ученик
 * - MENTOR: наставник
 * - ADMIN: администратор
 */
export enum Role {
	STUDENT = "STUDENT",
	MENTOR = "MENTOR",
	ADMIN = "ADMIN",
}

export const RoleSchema = v.picklist(
	[Role.STUDENT, Role.MENTOR, Role.ADMIN],
	"Недопустимая роль",
);
```

## Тестирование

1. Если тестов много, то группируй тесты на втором уровне по тестируемым методам.
1. Не ограничивайся удачным сценарием. Пиши тесты для граничных случаев, неудачных сценариев, задавай вопрос "А что если ...?".
1. Но не выходи в тестах за пределы ответственности объекта.

```typescript
import { describe, expect, test } from "bun:test";
import * as v from "valibot";
import { Role, RoleSchema } from "./roles";

describe("Роли пользователей (Roles)", () => {
	test("должны быть определены роли STUDENT, MENTOR, ADMIN", () => {
		expect(Role.STUDENT as string).toBe("STUDENT");
		expect(Role.MENTOR as string).toBe("MENTOR");
		expect(Role.ADMIN as string).toBe("ADMIN");
	});

	test("RoleSchema должна пропускать валидные значения ролей", () => {
		expect(v.safeParse(RoleSchema, Role.STUDENT).success).toBe(true);
		expect(v.safeParse(RoleSchema, Role.MENTOR).success).toBe(true);
		expect(v.safeParse(RoleSchema, Role.ADMIN).success).toBe(true);
	});

	test("RoleSchema должна отклонять невалидные значения", () => {
		expect(v.safeParse(RoleSchema, "GUEST").success).toBe(false);
		expect(v.safeParse(RoleSchema, "SUPER_ADMIN").success).toBe(false);
		expect(v.safeParse(RoleSchema, "").success).toBe(false);
	});
});
```
