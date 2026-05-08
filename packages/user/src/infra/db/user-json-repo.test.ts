import { beforeEach, describe, expect, test } from "bun:test";
import type { User } from "#domain/user/entity";
import { Role } from "#domain/user/roles";
import { UserJsonRepo } from "./user-json-repo";

// Хелперы для создания тестовых данных
const createTestUser = (overrides: Partial<User> = {}): User => ({
  uuid: crypto.randomUUID(),
  name: "Тестовый пользователь",
  telegramId: Math.floor(Math.random() * 1000000),
  roles: [Role.STUDENT],
  createdAt: "2026-05-01T12:00",
  ...overrides,
});

const saveUsers = async (repo: UserJsonRepo, users: User[]): Promise<void> => {
  for (const user of users) {
    await repo.save(user);
  }
};

const assertUserExists = async (
  repo: UserJsonRepo,
  uuid: string,
  expected: User,
): Promise<void> => {
  const found = await repo.getByUuid(uuid);
  expect(found).toEqual(expected);
};

const assertUserNotFound = async (
  repo: UserJsonRepo,
  uuid: string,
): Promise<void> => {
  const found = await repo.getByUuid(uuid);
  expect(found).toBeUndefined();
};

// Путь к временному файлу для тестов
const TEST_FILE = "/tmp/user-json-repo-test.json";

describe("UserJsonRepo", () => {
  let repo: UserJsonRepo;

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

  // Дополнительные пользователи для тестов фильтрации
  const petrStudent = createTestUser({
    uuid: "880e8400-e29b-41d4-a716-446655440003",
    name: "Петр Студент",
    telegramId: 111,
    roles: [Role.STUDENT],
    createdAt: "2026-01-01T10:00",
  });

  const anna = createTestUser({
    uuid: "990e8400-e29b-41d4-a716-446655440004",
    name: "Анна",
    telegramId: 222,
    roles: [Role.MENTOR],
    createdAt: "2026-03-15T14:00",
  });

  const boris = createTestUser({
    uuid: "aa0e8400-e29b-41d4-a716-446655440005",
    name: "Борис",
    telegramId: 333,
    roles: [Role.STUDENT, Role.MENTOR],
    createdAt: "2026-06-01T08:00",
  });

  beforeEach(async () => {
    // Удаляем тестовый файл перед каждым тестом
    await Bun.$`rm -f ${TEST_FILE}`;
    repo = new UserJsonRepo(TEST_FILE);
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
      expect(all).toEqual(expect.arrayContaining([user1, user2]));
    });

    test("перезаписывает существующего пользователя по uuid", async () => {
      await repo.save(user1);

      const updatedUser = { ...user1, name: "Иван Обновленный" };
      await repo.save(updatedUser);

      await assertUserExists(repo, user1.uuid, updatedUser);
    });

    test("обновляет telegramId при перезаписи", async () => {
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

    describe("фильтры", () => {
      beforeEach(async () => {
        await saveUsers(repo, [user1, user2, user3, petrStudent, anna, boris]);
      });

      test("фильтрует по роли — только STUDENT", async () => {
        const result = await repo.getAll({ role: Role.STUDENT });
        expect(result).toHaveLength(3);
        expect(result.map((u) => u.name)).toEqual(
          expect.arrayContaining(["Иван", "Петр Студент", "Борис"]),
        );
      });

      test("фильтрует по роли — роль без совпадений возвращает пустой массив", async () => {
        const result = await repo.getAll({ role: "NONEXISTENT" as Role });
        expect(result).toHaveLength(0);
      });

      test("ищет по имени — точное совпадение", async () => {
        const result = await repo.getAll({ name: "Иван" });
        expect(result).toHaveLength(1);
        expect(result[0]?.name).toBe("Иван");
      });

      test("ищет по имени — частичное совпадение", async () => {
        const result = await repo.getAll({ name: "Петр" });
        expect(result).toHaveLength(2);
        expect(result.map((u) => u.name)).toEqual(
          expect.arrayContaining(["Петр", "Петр Студент"]),
        );
      });

      test("ищет по имени — регистронезависимо", async () => {
        const result = await repo.getAll({ name: "мария" });
        expect(result).toHaveLength(1);
        expect(result[0]?.name).toBe("Мария");
      });

      test("ищет по имени — нет совпадений", async () => {
        const result = await repo.getAll({ name: "Несуществующий" });
        expect(result).toHaveLength(0);
      });

      test("фильтрует по telegramId — точное совпадение", async () => {
        const result = await repo.getAll({ telegramId: 123 });
        expect(result).toHaveLength(1);
        expect(result[0]?.name).toBe("Иван");
      });

      test("фильтрует по telegramId — нет совпадений", async () => {
        const result = await repo.getAll({ telegramId: 999999 });
        expect(result).toHaveLength(0);
      });
    });

    describe("сортировка", () => {
      beforeEach(async () => {
        await saveUsers(repo, [user1, user2, user3, petrStudent, anna, boris]);
      });

      test("сортирует по createdAt по возрастанию", async () => {
        const result = await repo.getAll({ sort: "createdAt:asc" });
        const dates = result.map((u) => u.createdAt);
        expect(dates).toEqual([
          "2026-01-01T10:00", // petrStudent
          "2026-03-15T14:00", // anna
          "2026-05-01T12:00", // user1, user2, user3
          "2026-05-01T12:00",
          "2026-05-01T12:00",
          "2026-06-01T08:00", // boris
        ]);
      });

      test("сортирует по createdAt по убыванию", async () => {
        const result = await repo.getAll({ sort: "createdAt:desc" });
        const dates = result.map((u) => u.createdAt);
        expect(dates[0]).toBe("2026-06-01T08:00"); // boris — самый новый
        expect(dates[dates.length - 1]).toBe("2026-01-01T10:00"); // petrStudent — самый старый
      });

      test("сортирует по name по возрастанию", async () => {
        const result = await repo.getAll({ sort: "name:asc" });
        const names = result.map((u) => u.name);
        expect(names[0]).toBe("Анна");
        expect(names[names.length - 1]).toBe("Петр Студент");
      });

      test("сортирует по name по убыванию", async () => {
        const result = await repo.getAll({ sort: "name:desc" });
        const names = result.map((u) => u.name);
        expect(names[0]).toBe("Петр Студент");
        expect(names[names.length - 1]).toBe("Анна");
      });
    });

    describe("лимит", () => {
      beforeEach(async () => {
        await saveUsers(repo, [user1, user2, user3, petrStudent, anna, boris]);
      });

      test("ограничивает количество результатов", async () => {
        const result = await repo.getAll({ limit: 2 });
        expect(result).toHaveLength(2);
      });

      test("limit=0 возвращает пустой массив", async () => {
        const result = await repo.getAll({ limit: 0 });
        expect(result).toHaveLength(0);
      });

      test("limit больше количества пользователей возвращает всех", async () => {
        const result = await repo.getAll({ limit: 100 });
        expect(result).toHaveLength(6);
      });
    });

    describe("комбинированные фильтры", () => {
      beforeEach(async () => {
        await saveUsers(repo, [user1, user2, user3, petrStudent, anna, boris]);
      });

      test("фильтр по роли + сортировка", async () => {
        const result = await repo.getAll({
          role: Role.STUDENT,
          sort: "name:asc",
        });
        expect(result).toHaveLength(3);
        expect(result[0]?.name).toBe("Борис");
        expect(result[1]?.name).toBe("Иван");
        expect(result[2]?.name).toBe("Петр Студент");
      });

      test("фильтр по имени + лимит", async () => {
        const result = await repo.getAll({ name: "Петр", limit: 1 });
        expect(result).toHaveLength(1);
      });

      test("все фильтры вместе", async () => {
        const result = await repo.getAll({
          role: Role.MENTOR,
          name: "борис",
          sort: "createdAt:asc",
          limit: 5,
        });
        expect(result).toHaveLength(1);
        expect(result[0]?.name).toBe("Борис");
      });

      test("без фильтра — возвращает всех", async () => {
        const result = await repo.getAll();
        expect(result).toHaveLength(6);
      });

      test("пустой фильтр — возвращает всех", async () => {
        const result = await repo.getAll({});
        expect(result).toHaveLength(6);
      });
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

  describe("устойчивость к повреждённым данным", () => {
    test("невалидные объекты в файле пропускаются с логом", async () => {
      // Сначала сохраняем валидного пользователя
      await repo.save(user1);

      // Имитируем ручное добавление невалидных данных в файл
      const raw = [
        user1,
        { uuid: "bad-1", name: "", telegramId: 1, roles: [], createdAt: "bad-date" },
        { uuid: "bad-2" },
      ];
      await Bun.write(TEST_FILE, JSON.stringify(raw, null, 2));

      // Создаём новый репо на том же файле
      const repo2 = new UserJsonRepo(TEST_FILE);
      const result = await repo2.getAll();

      // Должен быть только валидный user1
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(user1);
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
