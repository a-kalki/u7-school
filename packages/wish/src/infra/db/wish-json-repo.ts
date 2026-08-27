import { JsonFileRepo } from '@u7-scl/core/infra';
import type { Wish, WishTarget } from '#domain/wish/entity';
import { WishSchema } from '#domain/wish/entity';
import type { WishRepo } from '#domain/wish/repo';

/** Проверяет равенство целей желания (сравнение по варианту и его ключам). */
function isSameTarget(a: WishTarget, b: WishTarget): boolean {
  if (a.kind !== b.kind) {
    return false;
  }
  if (a.kind === 'course' && b.kind === 'course') {
    return a.courseId === b.courseId;
  }
  if (a.kind === 'module' && b.kind === 'module') {
    return a.moduleId === b.moduleId;
  }
  return false;
}

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

  async getByUserAndTarget(
    userId: string,
    target: WishTarget,
  ): Promise<Wish | undefined> {
    const all = await this.#repo.readAll();
    const matches = all.filter(
      (w) => w.userId === userId && isSameTarget(w.target, target),
    );
    matches.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return matches[0];
  }

  async getByUser(userId: string): Promise<Wish[]> {
    const all = await this.#repo.readAll();
    return all.filter((w) => w.userId === userId);
  }
}
