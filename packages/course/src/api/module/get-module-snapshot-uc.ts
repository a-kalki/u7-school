import { CourseDs } from '#domain/course-ds';
import type { Module } from '#domain/module/entity';
import type { Lesson } from '#domain/lesson/entity';
import type { ContentSnapshot } from '#domain/types';
import * as v from 'valibot';
import type {
  GetModuleSnapshotCmd,
  GetModuleSnapshotCmdMeta,
} from '#domain/module/commands/get-module-snapshot-cmd';
import { GetModuleSnapshotCmdSchema } from '#domain/module/commands/get-module-snapshot-cmd';
import { CourseUseCase } from '../course-uc';

/**
 * Use-case получения снимка контента модуля.
 * Собирает полное дерево: проекты → уроки → stepIds.
 */
export class GetModuleSnapshotUc extends CourseUseCase<GetModuleSnapshotCmdMeta> {
  protected readonly ucName = 'get-module-snapshot' as const;
  protected readonly ucLabel = 'Получить снимок контента модуля' as const;
  protected readonly arMeta = {
    arName: 'Module' as const,
    arLabel: 'Модуль' as const,
  };
  protected readonly type = 'query' as const;
  protected readonly requiresAuth = false as const;
  protected readonly inputSchema = GetModuleSnapshotCmdSchema;
  protected readonly outputSchema = v.array(v.any());

  async execute(
    command: GetModuleSnapshotCmd,
    actorId?: string,
  ): Promise<ContentSnapshot> {
    const module = await this.getModule(command.moduleId);
    const actor = actorId ? await this.getUser(actorId, actorId) : undefined;

    // Проверяем видимость модуля
    this.getOutModule(module, actor);

    // Собираем уроки для всех проектов модуля
    const allLessonIds = module.projects.flatMap((p) => p.lessonIds);
    const uniqueLessonIds = [...new Set(allLessonIds)];

    const lessons: Lesson[] = [];
    for (const lessonId of uniqueLessonIds) {
      const lesson = await this.resolve.lessonRepo.getByUuid(lessonId);
      if (lesson) {
        // Применяем фильтр видимости
        const outLesson = await this.getOutLesson(lesson, actor);
        lessons.push(outLesson);
      }
    }

    const ds = new CourseDs();
    return ds.buildSnapshot(module, lessons);
  }
}
