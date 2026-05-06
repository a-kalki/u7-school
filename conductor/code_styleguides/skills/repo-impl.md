# Реализация репозитория

## Назначение

Файл `infra/db/<entity-name>-<type>-repo.ts` содержит конкретную реализацию интерфейса `Repo`. Например: `UserInmemoryRepo`.

## Правила

1. Реализует интерфейс из `domain/<entity>/repo.ts`.
1. Не содержит бизнес-логику — только хранение и извлечение.

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
import type { User } from "../../domain/user/entity";
import type { UserRepo } from "../../domain/user/repo";

export class UserInmemoryRepo implements UserRepo {
	#byUuid = new Map<string, User>();
	#byTelegramId = new Map<number, User>();

	async save(user: User): Promise<void> {
		this.#byUuid.set(user.uuid, user);
		this.#byTelegramId.set(user.telegramId, user);
	}

	async getByUuid(uuid: string): Promise<User | undefined> {
		return this.#byUuid.get(uuid);
	}

	async getByTelegramId(telegramId: number): Promise<User | undefined> {
		return this.#byTelegramId.get(telegramId);
	}

	async getAll(): Promise<User[]> {
		return Array.from(this.#byUuid.values());
	}

	async isTelegramIdTaken(telegramId: number): Promise<boolean> {
		return this.#byTelegramId.has(telegramId);
	}

	async isEmpty(): Promise<boolean> {
		return this.#byUuid.size === 0;
	}
}
```

## Тестирование

1. Каждый метод как правило покрывается тестом.
1. Если тестов много, то группируй тесты на втором уровне по тестируемым методам.
1. Не ограничивайся удачным сценарием. Пиши тесты для граничных случаев, неудачных сценариев, задавай вопрос "А что если ...?".
1. Но не выходи в тестах за пределы ответственности объекта.
1. Помни, в пирамиде тестов доменные объекты должны иметь самое лучшее покрытие различных поведенческих случаев.
1. Помни, в тестировании на уровне `usecase` корректность работы репозитория не проверяется. Все обращения в репозиторий будут мокаться.
1. Реальное тестирование работы репозитория в тестах будет производиться на уровне тестов модуля. Но этот тест осуществляет проверку подключения и обработки запросов, т.е. ограниченный тест.
1. Обеспечь через тесты репозитория корректную работу всех режимов работы.
1. Выноси повторяющуюся логику в хелперы.
1. Стремись чтобы каждый тест был не более 10 строк кода, пусть тест будет кратким и понятным.

```typescript
import { describe, expect, test, beforeEach } from "bun:test";
import { UserInmemoryRepo } from "./user-inmemory-repo";
import { Role } from "../../domain/user/roles";
import type { User } from "../../domain/user/entity";

// Хелперы для создания тестовых данных
const createTestUser = (overrides: Partial<User> = {}): User => ({
  uuid: crypto.randomUUID(),
  name: "Тестовый пользователь",
  telegramId: Math.floor(Math.random() * 1000000),
  roles: [Role.STUDENT],
  createdAt: "2026-05-01T12:00",
  ...overrides,
});

const saveUsers = async (repo: UserInmemoryRepo, users: User[]): Promise<void> => {
  for (const user of users) {
    await repo.save(user);
  }
};

// Ассерт-хелперы
const assertUserExists = async (repo: UserInmemoryRepo, uuid: string, expected: User): Promise<void> => {
  const found = await repo.getByUuid(uuid);
  expect(found).toEqual(expected);
};

const assertUserNotFound = async (repo: UserInmemoryRepo, uuid: string): Promise<void> => {
  const found = await repo.getByUuid(uuid);
  expect(found).toBeUndefined();
};

describe("UserInmemoryRepo", () => {
  let repo: UserInmemoryRepo;
  
  const user1 = createTestUser({
    uuid: "550e8400-e29b-41d4-a716-446655440000",
    name: "Иван",
    telegramId: 123,
  });
  
  const user2 = createTestUser({
    uuid: "660e8400-e29b-41d4-a716-446655440001",
    name: "Петр",
    telegramId: 456,
    roles: [Role.MENTOR],
  });
  
  const user3 = createTestUser({
    uuid: "770e8400-e29b-41d4-a716-446655440002",
    name: "Мария",
    telegramId: 789,
    roles: [Role.ADMIN],
  });

  beforeEach(() => {
    repo = new UserInmemoryRepo();
  });

  describe("save", () => {
    test("сохраняет пользователя", async () => {
      await repo.save(user1);
      await assertUserExists(repo, user1.uuid, user1);
    });

    test("сохраняет несколько пользователей", async () => {
      await saveUsers(repo, [user1, user2]);
      
      const all = await repo.getAll();
      expect(all).toHaveLength(2);
      expect(all).toContainEqual(user1);
      expect(all).toContainEqual(user2);
    });

    test("перезаписывает существующего пользователя по uuid", async () => {
      await repo.save(user1);
      
      const updatedUser = { ...user1, name: "Иван Обновленный" };
      await repo.save(updatedUser);
      
      await assertUserExists(repo, user1.uuid, updatedUser);
    });

    test("обновляет telegramId в мапе при перезаписи", async () => {
      await repo.save(user1);
      
      const updatedUser = { ...user1, telegramId: 999 };
      await repo.save(updatedUser);
      
      expect(await repo.getByTelegramId(user1.telegramId)).toBeUndefined();
      expect(await repo.getByTelegramId(999)).toEqual(updatedUser);
    });
  });

  describe("getByUuid", () => {
    test("возвращает пользователя по существующему uuid", async () => {
      await repo.save(user1);
      await assertUserExists(repo, user1.uuid, user1);
    });

    test("возвращает undefined для несуществующего uuid", async () => {
      await assertUserNotFound(repo, "non-existent-uuid");
    });
  });

  describe("getByTelegramId", () => {
    test("возвращает пользователя по существующему telegramId", async () => {
      await repo.save(user1);
      
      const result = await repo.getByTelegramId(user1.telegramId);
      expect(result).toEqual(user1);
    });

    test("возвращает undefined для несуществующего telegramId", async () => {
      const result = await repo.getByTelegramId(999999);
      expect(result).toBeUndefined();
    });
  });

  describe("getAll", () => {
    test("возвращает пустой массив для пустого репозитория", async () => {
      expect(await repo.getAll()).toEqual([]);
    });

    test("возвращает всех сохранённых пользователей", async () => {
      await saveUsers(repo, [user1, user2, user3]);
      
      const result = await repo.getAll();
      expect(result).toHaveLength(3);
      expect(result).toEqual(expect.arrayContaining([user1, user2, user3]));
    });

    test("возвращает актуальные данные после обновления", async () => {
      await repo.save(user1);
      
      const updatedUser = { ...user1, name: "Новое имя" };
      await repo.save(updatedUser);
      
      const all = await repo.getAll();
      expect(all).toHaveLength(1);
      expect(all[0]).toEqual(updatedUser);
    });
  });

  describe("isTelegramIdTaken", () => {
    test("возвращает true для существующего telegramId", async () => {
      await repo.save(user1);
      expect(await repo.isTelegramIdTaken(user1.telegramId)).toBe(true);
    });

    test("возвращает false для несуществующего telegramId", async () => {
      expect(await repo.isTelegramIdTaken(999999)).toBe(false);
    });

    test("отслеживает изменения при перезаписи", async () => {
      await repo.save(user1);
      
      const updatedUser = { ...user1, telegramId: 999 };
      await repo.save(updatedUser);
      
      expect(await repo.isTelegramIdTaken(user1.telegramId)).toBe(false);
      expect(await repo.isTelegramIdTaken(999)).toBe(true);
    });
  });

  describe("isEmpty", () => {
    test("возвращает true для пустого репозитория", async () => {
      expect(await repo.isEmpty()).toBe(true);
    });

    test("возвращает false после сохранения пользователя", async () => {
      await repo.save(user1);
      expect(await repo.isEmpty()).toBe(false);
    });
  });

  describe("Комбинированные сценарии", () => {
    test("корректно работает последовательность операций", async () => {
      // Пустой репозиторий
      expect(await repo.isEmpty()).toBe(true);
      
      // Сохраняем
      await saveUsers(repo, [user1, user2]);
      expect(await repo.getAll()).toHaveLength(2);
      
      // Проверяем поиск
      expect(await repo.getByUuid(user1.uuid)).toEqual(user1);
      expect(await repo.getByTelegramId(user2.telegramId)).toEqual(user2);
      
      // Обновляем
      const updated = { ...user1, name: "Обновлённый" };
      await repo.save(updated);
      expect(await repo.getByUuid(user1.uuid)).toEqual(updated);
    });
  });
});
```
```
