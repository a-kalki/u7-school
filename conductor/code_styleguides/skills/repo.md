# Репозиторий (интерфейс)

## Назначение

Файл `domain/<entity>/repo.ts` определяет контракт хранения и извлечения сущностей. Как правило, каждый агрегат имеет свой репозиторий. Чистый интерфейс — без привязки к конкретной БД.

## Правила

1. Только `interface`, никаких классов.
1. Все методы возвращают `Promise` или `MaybePromise`.
1. Методы поиска возвращают `undefined` вместо `null` при отсутствии результата.
1. Не содержит бизнес-логику — только CRUD-контракт.
1. Имена методов domain-friendly.

## Пример

```typescript
import type { User } from "./entity";

export interface UserRepo {
	save(user: User): Promise<void>;
	getByUuid(uuid: string): Promise<User | undefined>;
	getByTelegramId(telegramId: number): Promise<User | undefined>;
	getAll(): Promise<User[]>;
	isTelegramIdTaken(telegramId: number): Promise<boolean>;
	isEmpty(): Promise<boolean>;
}
```

## Регресс

**Недопустимо** ломать существующий функционал и тесты, не связанные с текущей задачей: меняй только то, что относится к задаче, не удаляй и не переписывай корректные тесты — только добавляй новые. Подробные правила — [testing.md, §«Защита от регресса и чистота правок»](../testing.md).
