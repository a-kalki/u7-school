import { AppException } from '@u7-scl/core/domain';
import type { ContentSnapshot } from '#domain/content-snapshot';
import type { Course } from '#domain/course/entity';
import type { CourseFacade, CourseProgram, ModulePlace } from '#domain/facade';
import type { Module } from '#domain/module/entity';
import { Status } from '#domain/status';
import type { Step } from '#domain/step/entity';
import type { CourseApiModule } from '../api/module';

/**
 * In-process реализация фасада курсов.
 * Делегирует вызовы CourseApiModule, не дублируя бизнес-логику.
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
    const courses: Course[] = await this.courseModule.execute(
      'list-courses',
      {},
    );
    return courses.find((c) =>
      c.phases.some((p) => p.moduleIds.includes(moduleId)),
    );
  }

  async whichCoursesIncludeModule(
    moduleId: string,
    courseIds: string[],
  ): Promise<string[]> {
    if (courseIds.length === 0) {
      return [];
    }
    // get-course возвращает курс в любом статусе, включая archived —
    // это и даёт «историческую» принадлежность (форки, архивация).
    const matched: string[] = [];
    for (const courseId of courseIds) {
      const course = await this.getCourse(courseId);
      if (course?.phases.some((p) => p.moduleIds.includes(moduleId))) {
        matched.push(courseId);
      }
    }
    return matched;
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

  async isCourseEnrollable(courseId: string): Promise<boolean> {
    const course = await this.getCourse(courseId);
    return course?.status === Status.PUBLISHED;
  }

  async getCourseStartModuleId(courseId: string): Promise<string | undefined> {
    const course = await this.getCourse(courseId);
    if (!course) return undefined;
    return course.phases.flatMap((p) => p.moduleIds)[0];
  }

  async getModulePlace(moduleId: string): Promise<ModulePlace | undefined> {
    // list-courses без параметров возвращает только опубликованные курсы
    const courses: Course[] = await this.courseModule.execute(
      'list-courses',
      {},
    );
    const containing = courses.filter((c) =>
      c.phases.some((p) => p.moduleIds.includes(moduleId)),
    );
    if (containing.length === 0) return undefined;

    const published = containing.find((c) => c.status === Status.PUBLISHED);
    const course = published ?? containing[0];
    if (!course) return undefined;
    const allModuleIds = course.phases.flatMap((p) => p.moduleIds);
    const idx = allModuleIds.indexOf(moduleId);
    if (idx === -1) return undefined;

    return {
      courseId: course.uuid,
      isFirst: idx === 0,
      isLast: idx === allModuleIds.length - 1,
      prevModuleId: idx > 0 ? allModuleIds[idx - 1] : undefined,
      nextModuleId:
        idx < allModuleIds.length - 1 ? allModuleIds[idx + 1] : undefined,
    };
  }

  async isSameModule(moduleIdA: string, moduleIdB: string): Promise<boolean> {
    // Сегодня историческая идентичность тривиальна; контракт — для будущих
    // версий модулей (копия модуля с другим id — тот же модуль).
    return moduleIdA === moduleIdB;
  }

  async getCourseProgram(courseId: string): Promise<CourseProgram> {
    const course: Course = await this.courseModule.execute('get-course', {
      uuid: courseId,
    });

    const phases = await Promise.all(
      course.phases.map(async (phase) => {
        const modules = await Promise.all(
          phase.moduleIds.map((moduleId) => this.getModuleSnapshot(moduleId)),
        );
        return {
          title: phase.title,
          track: phase.track,
          modules,
        };
      }),
    );

    return { course, phases };
  }
}
