import { JsonFileRepo } from "@u7/core/infra";
import type { Lesson } from "#domain/lesson/entity";
import { LessonSchema } from "#domain/lesson/entity";
import type { LessonRepo } from "#domain/lesson/repo";

/**
 * JSON-файловая реализация репозитория уроков.
 * Хранит данные в JSON-файле через {@link JsonFileRepo}.
 */
export class LessonJsonRepo implements LessonRepo {
  readonly #repo: JsonFileRepo<Lesson>;

  constructor(filePath = "data/courses/lessons.json") {
    this.#repo = new JsonFileRepo(LessonSchema, filePath);
  }

  async save(lesson: Lesson): Promise<void> {
    const all = await this.#repo.readAll();
    const idx = all.findIndex((l) => l.uuid === lesson.uuid);
    if (idx !== -1) {
      all[idx] = lesson;
    } else {
      all.push(lesson);
    }
    await this.#repo.writeAll(all);
  }

  async getByUuid(uuid: string): Promise<Lesson | undefined> {
    const all = await this.#repo.readAll();
    return all.find((l) => l.uuid === uuid);
  }

  async getByIds(ids: string[]): Promise<Lesson[]> {
    const all = await this.#repo.readAll();
    return all.filter((l) => ids.includes(l.uuid));
  }
}
