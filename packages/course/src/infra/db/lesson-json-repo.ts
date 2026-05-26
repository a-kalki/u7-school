import { JsonFileRepo } from '@u7-scl/core/infra';
import type { Lesson } from '#domain/lesson/entity';
import { LessonSchema } from '#domain/lesson/entity';
import type { LessonRepo } from '#domain/lesson/repo';

/**
 * JSON-реализация репозитория уроков.
 */
export class LessonJsonRepo extends JsonFileRepo<Lesson> implements LessonRepo {
  constructor(filePath = 'data/courses/lessons.json') {
    super(LessonSchema, filePath);
  }

  async save(lesson: Lesson): Promise<void> {
    const all = await this.readAll();
    const idx = all.findIndex((l) => l.uuid === lesson.uuid);
    if (idx !== -1) all[idx] = lesson;
    else all.push(lesson);
    await this.writeAll(all);
  }

  async getByUuid(uuid: string): Promise<Lesson | undefined> {
    const all = await this.readAll();
    return all.find((l) => l.uuid === uuid);
  }

  async getByIds(ids: string[]): Promise<Lesson[]> {
    const all = await this.readAll();
    return all.filter((l) => ids.includes(l.uuid));
  }

  async getByCourseId(moduleId: string): Promise<Lesson[]> {
    const all = await this.readAll();
    return all.filter((l) => l.moduleId === moduleId);
  }
}
