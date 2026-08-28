import { AppException } from '@u7-scl/core/domain';
import type { ContentSnapshot } from '#domain/content-snapshot';
import type { CourseProgram } from '#domain/course/commands/get-course-program-cmd';
import type { Course } from '#domain/course/entity';
import type { CourseFacade, ModulePlace } from '#domain/facade';
import { CoursePolicy } from '#domain/index';
import type { Module } from '#domain/module/entity';
import type { Step } from '#domain/step/entity';
import type { CourseApiModule } from '../api/module';

/**
 * In-process реализация фасада курсов.
 * Тонкая обёртка над UC модуля: реальная работа — в use-case'ах,
 * здесь только делегирование и адаптация результата под контракт фасада.
 */
export class CourseInProcFacade implements CourseFacade {
  constructor(private readonly courseModule: CourseApiModule) {}

  async getModuleSnapshot(moduleId: string): Promise<ContentSnapshot> {
    return this.courseModule.execute('get-module-snapshot', { moduleId });
  }

  async getStep(stepId: string): Promise<Step> {
    return this.courseModule.execute('get-step', { uuid: stepId });
  }

  async getModule(moduleId: string): Promise<Module> {
    return this.courseModule.execute('get-module', {
      uuid: moduleId,
    });
  }

  async getCourseByModuleId(moduleId: string): Promise<Course | undefined> {
    return this.courseModule.execute('get-course-by-module', { moduleId });
  }

  async whichCoursesIncludeModule(
    moduleId: string,
    courseIds: string[],
  ): Promise<string[]> {
    return this.courseModule.execute('which-courses-include-module', {
      moduleId,
      courseIds,
    });
  }

  async getCourse(courseId: string): Promise<Course | undefined> {
    try {
      return await this.courseModule.execute('get-course', {
        uuid: courseId,
      });
    } catch (error) {
      if (
        error instanceof AppException &&
        error.error.name === 'COURSE_NOT_FOUND'
      ) {
        return undefined;
      }
      throw error;
    }
  }

  /**
   * Простая операция (существует + опубликован) — остаётся в фасаде:
   * один вызов UC + проверка статуса через CoursePolicy.
   */
  async isCourseEnrollable(courseId: string): Promise<boolean> {
    const course = await this.getCourse(courseId);
    return !!course && CoursePolicy.isPublished(course);
  }

  /**
   * Простая операция (первый модуль линейного порядка фаз) — остаётся
   * в фасаде: один вызов UC + тривиальное преобразование.
   */
  async getCourseStartModuleId(courseId: string): Promise<string | undefined> {
    const course = await this.getCourse(courseId);
    if (!course) return undefined;
    return course.phases.flatMap((p) => p.moduleIds)[0];
  }

  async getModulePlace(moduleId: string): Promise<ModulePlace | undefined> {
    return this.courseModule.execute('get-module-place', { moduleId });
  }

  async isSameModule(moduleIdA: string, moduleIdB: string): Promise<boolean> {
    // Сегодня историческая идентичность тривиальна; контракт — для будущих
    // версий модулей (копия модуля с другим id — тот же модуль).
    return moduleIdA === moduleIdB;
  }

  async getCourseProgram(courseId: string): Promise<CourseProgram> {
    return this.courseModule.execute('get-course-program', { courseId });
  }
}
