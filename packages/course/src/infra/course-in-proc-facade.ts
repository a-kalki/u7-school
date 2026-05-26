import { CourseDs } from '#domain/course-ds';
import type { CourseFacade } from '#domain/facade';
import type { Lesson } from '#domain/lesson/entity';
import type { CourseApiModuleResolver } from '#domain/module';
import type { Module } from '#domain/module/entity';
import type { ContentSnapshot } from '#domain/types';

/**
 * In-process реализация фасада курсов.
 * Использует репозитории и CourseDs напрямую.
 */
export class CourseInProcFacade implements CourseFacade {
  constructor(private readonly resolve: CourseApiModuleResolver) {}

  async getModuleSnapshot(moduleId: string): Promise<ContentSnapshot> {
    const module = await this.resolve.courseRepo.getByUuid(moduleId);
    if (!module) {
      return [];
    }

    // Собираем уроки для всех проектов
    const allLessonIds = module.projects.flatMap((p) => p.lessonIds);
    const uniqueLessonIds = [...new Set(allLessonIds)];

    const lessons: Lesson[] = [];
    for (const lessonId of uniqueLessonIds) {
      const lesson = await this.resolve.lessonRepo.getByUuid(lessonId);
      if (lesson) {
        lessons.push(lesson);
      }
    }

    const ds = new CourseDs();
    return ds.buildSnapshot(module, lessons);
  }
}
