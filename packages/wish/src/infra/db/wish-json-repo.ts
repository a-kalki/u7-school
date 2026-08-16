import { JsonFileRepo } from '@u7-scl/core/infra';
import type { Wish } from '#domain/wish/entity';
import { WishSchema } from '#domain/wish/entity';
import type { WishRepo } from '#domain/wish/repo';

/**
 * JSON-файловая реализация репозитория желаний.
 * Хранит данные в JSON-файле через {@link JsonFileRepo}.
 */
export class WishJsonRepo implements WishRepo {
  readonly #repo: JsonFileRepo<Wish>;

  constructor(filePath = 'data/wish/wishes.json') {
    this.#repo = new JsonFileRepo(WishSchema, filePath);
  }

  async save(wish: Wish): Promise<void> {
    const all = await this.#repo.readAll();
    const idx = all.findIndex((w) => w.uuid === wish.uuid);
    if (idx !== -1) {
      all[idx] = wish;
    } else {
      all.push(wish);
    }
    await this.#repo.writeAll(all);
  }

  async getByUuid(uuid: string): Promise<Wish | undefined> {
    const all = await this.#repo.readAll();
    return all.find((w) => w.uuid === uuid);
  }

  async getByUserAndCourse(
    userId: string,
    courseId: string,
  ): Promise<Wish | undefined> {
    const all = await this.#repo.readAll();
    const matches = all.filter(
      (w) => w.userId === userId && w.courseId === courseId,
    );
    matches.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return matches[0];
  }

  async getByUser(userId: string): Promise<Wish[]> {
    const all = await this.#repo.readAll();
    return all.filter((w) => w.userId === userId);
  }
}
