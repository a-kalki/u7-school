import type { BaseJsonDb } from '@u7-scl/core/infra';
import { JsonFileRepo } from '@u7-scl/core/infra';
import { getGlobalLogger } from '@u7-scl/core/shared';
import type { User } from '#domain/user/entity';
import { UserSchema } from '#domain/user/entity';
import type { UserListFilter, UserRepo } from '#domain/user/repo';

/**
 * JSON-файловая реализация репозитория пользователей.
 * Хранит данные в JSON-файле через {@link JsonFileRepo}.
 * При первом обращении, если файл данных отсутствует, загружает seed.
 */
export class UserJsonRepo implements UserRepo {
  readonly #repo: JsonFileRepo<User>;
  readonly #seedPath: string;
  #initialized = false;

  /**
   * @param filePath — путь к JSON-файлу (по умолчанию "data/users/users.json")
   * @param seedPath — путь к seed-файлу (по умолчанию "data/users/seed.json")
   * @param db — опционально: экземпляр BaseJsonDb для транзакционной поддержки
   */
  constructor(
    filePath = 'data/users/users.json',
    seedPath = 'data/users/seed.json',
    db?: BaseJsonDb,
  ) {
    this.#repo = new JsonFileRepo(UserSchema, filePath, db, 'users');
    this.#seedPath = seedPath;
  }

  /**
   * При первом обращении: если файла данных нет, загружает seed.
   */
  async #ensureInit(): Promise<void> {
    if (this.#initialized) return;
    this.#initialized = true;

    const file = Bun.file(this.#repo.filePath);
    if (await file.exists()) return;

    // Загружаем seed
    const seedFile = Bun.file(this.#seedPath);
    if (!(await seedFile.exists())) return;

    let seedData: unknown;
    try {
      seedData = await seedFile.json();
    } catch {
      getGlobalLogger()?.warn(
        'user-repo',
        `Не удалось распарсить seed-файл ${this.#seedPath}`,
      );
      return;
    }

    if (!Array.isArray(seedData)) {
      getGlobalLogger()?.warn(
        'user-repo',
        `Seed-файл ${this.#seedPath} должен быть массивом`,
      );
      return;
    }

    // Валидируем seed-данные через JsonFileRepo (записываем сырые, он сам отфильтрует)
    await this.#repo.writeAll(seedData as User[]);
  }

  async save(user: User): Promise<void> {
    await this.#ensureInit();
    const all = await this.#repo.readAll();
    const idx = all.findIndex((u) => u.uuid === user.uuid);

    if (idx !== -1) {
      all[idx] = user;
    } else {
      all.push(user);
    }

    await this.#repo.writeAll(all);
  }

  async getByUuid(uuid: string): Promise<User | undefined> {
    await this.#ensureInit();
    const all = await this.#repo.readAll();
    return all.find((u) => u.uuid === uuid);
  }

  async getByTelegramId(telegramId: number): Promise<User | undefined> {
    await this.#ensureInit();
    const all = await this.#repo.readAll();
    return all.find((u) => u.telegramId === telegramId);
  }

  async getAll(filter?: UserListFilter): Promise<User[]> {
    await this.#ensureInit();
    let users = await this.#repo.readAll();

    if (filter) {
      if (filter.role) {
        // biome-ignore lint/style/noNonNullAssertion: проверены выше;
        users = users.filter((u) => u.roles.includes(filter.role!));
      }

      if (filter.name) {
        const nameLower = filter.name.toLowerCase();
        users = users.filter((u) => u.name.toLowerCase().includes(nameLower));
      }

      if (filter.telegramId !== undefined) {
        users = users.filter((u) => u.telegramId === filter.telegramId);
      }

      if (filter.sort) {
        const [field, dir] = filter.sort.split(':') as [
          'createdAt' | 'name',
          'asc' | 'desc',
        ];
        const multiplier = dir === 'asc' ? 1 : -1;
        users.sort((a, b) => {
          const va = a[field];
          const vb = b[field];
          if (va < vb) return -1 * multiplier;
          if (va > vb) return 1 * multiplier;
          return 0;
        });
      }

      if (filter.limit !== undefined) {
        users = users.slice(0, filter.limit);
      }
    }

    return users;
  }

  async isTelegramIdTaken(telegramId: number): Promise<boolean> {
    await this.#ensureInit();
    const all = await this.#repo.readAll();
    return all.some((u) => u.telegramId === telegramId);
  }

  async isNickTaken(nick: string): Promise<boolean> {
    await this.#ensureInit();
    const all = await this.#repo.readAll();
    return all.some((u) => u.nick === nick);
  }

  async isEmpty(): Promise<boolean> {
    await this.#ensureInit();
    const all = await this.#repo.readAll();
    return all.length === 0;
  }
}
