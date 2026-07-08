# Сущность (Entity) — Styleguide

**Назначение:** файл `domain/<entity>/entity.ts` — единственный источник истины для структуры данных предметной области. Содержит схему валидации (`<EntityName>Schema`, Valibot), тип сущности (`<EntityName>`) и метаданные агрегата (`<EntityName>ArMeta`).

---

## 1. Ключевые правила

1. **Все поля валидируются через Valibot** — тип сущности выводится из схемы (`v.InferOutput`).
2. В этом же файле объявляется мета агрегата `<Name>ArMeta` (`name`, `label`, `state`).
3. В `ArMeta` — только ошибки, выбрасываемые самим агрегатом.
4. **Только структура и валидация** — никакой бизнес-логики (она в `a-root.ts`).
5. Для public-DTO без служебных полей (`createdAt`/`updatedAt`) выведите отдельный `OutSchema` через деструктуризацию `entries`.

Живой пример: [`packages/stream/src/domain/stream/entity.ts`](../../../packages/stream/src/domain/stream/entity.ts).

---

## 2. Шаблон схемы

```typescript
import * as v from "valibot";

export const StreamSchema = v.object({
	uuid: v.pipe(v.string(), v.uuid()),
	title: v.pipe(v.string(), v.trim(), v.nonEmpty()),
	// ...остальные поля с валидацией
});

export type Stream = v.InferOutput<typeof StreamSchema>;

export interface StreamArMeta {
	name: "stream";
	label: "Поток";
	state: Stream;
}
```

---

## 3. Тестирование

Тестирование схемы валидации должно быть **максимально полным** — это фундамент, на который опираются все остальные слои (агрегаты, UC доверяют состоянию сущности).

- Группируйте тесты на втором уровне по полям (`describe("поле uuid")`).
- Покрывайте граничные и неудачные сценарии, не только успешный.
- Не выходите за пределы ответственности объекта (валидация полей).

Живой пример теста: `packages/stream/src/domain/stream/entity.test.ts`.

---

## Связанные файлы

- [Агрегат](./aggregate.md) — класс `Ar`, использует схему из `entity.ts`
- [Команда](./commands.md) — `CmdSchema` наследует правила из `EntitySchema.entries`
- [DDD принципы](../ddd.md)
