import { JsonFileRepo } from "@u7/core/infra";
import type { User } from "#domain/user/entity";
import type { UserListFilter, UserRepo } from "#domain/user/repo";
import { UserSchema } from "#domain/user/entity";

/**
 * JSON-файловая реализация репозитория пользователей.
 * Хранит данные в JSON-файле через {@link JsonFileRepo}.
 */
export class UserJsonRepo implements UserRepo {
  readonly #repo: JsonFileRepo<User>;

  /**
   * @param filePath — путь к JSON-файлу (по умолчанию "data/users/users.json")
   */
  constructor(filePath = "data/users/users.json") {
    this.#repo = new JsonFileRepo(UserSchema, filePath);
  }

  async save(user: User): Promise<void> {
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
    const all = await this.#repo.readAll();
    return all.find((u) => u.uuid === uuid);
  }

  async getByTelegramId(telegramId: number): Promise<User | undefined> {
    const all = await this.#repo.readAll();
    return all.find((u) => u.telegramId === telegramId);
  }

  async getAll(filter?: UserListFilter): Promise<User[]> {
    let users = await this.#repo.readAll();

    if (filter) {
      if (filter.role) {
        users = users.filter((u) => u.roles.includes(filter.role!));
      }

      if (filter.name) {
        const nameLower = filter.name.toLowerCase();
        users = users.filter((u) =>
          u.name.toLowerCase().includes(nameLower),
        );
      }

      if (filter.telegramId !== undefined) {
        users = users.filter((u) => u.telegramId === filter.telegramId);
      }

      if (filter.sort) {
        const [field, dir] = filter.sort.split(":") as [
          "createdAt" | "name",
          "asc" | "desc",
        ];
        const multiplier = dir === "asc" ? 1 : -1;
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
    const all = await this.#repo.readAll();
    return all.some((u) => u.telegramId === telegramId);
  }

  async isEmpty(): Promise<boolean> {
    const all = await this.#repo.readAll();
    return all.length === 0;
  }
}
