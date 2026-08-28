import * as v from 'valibot';
import {
  type GetCourseByModuleCmd,
  type GetCourseByModuleCmdMeta,
  GetCourseByModuleCmdSchema,
} from '#domain/course/commands/get-course-by-module-cmd';
import type { Course } from '#domain/course/entity';
import { CourseSchema } from '#domain/course/entity';
import { CourseDs } from '#domain/course-ds';
import { CourseUseCase } from '../course-uc';

/**
 * Use-case поиска курса, содержащего модуль (в любом статусе).
 * Связь модуль↔курс — через CourseDs (готово к будущим форкам/копиям).
 */
export class GetCourseByModuleUc extends CourseUseCase<GetCourseByModuleCmdMeta> {
  protected readonly ucName = 'get-course-by-module' as const;
  protected readonly ucLabel = 'Найти курс по модулю' as const;
  protected readonly arMeta = {
    arName: 'Course' as const,
    arLabel: 'Курс' as const,
  };
  protected readonly type = 'query' as const;
  protected readonly requiresAuth = false as const;
  protected readonly inputSchema = GetCourseByModuleCmdSchema;
  protected readonly outputSchema = v.optional(CourseSchema);

  async execute(
    command: GetCourseByModuleCmd,
    _actorId?: string,
  ): Promise<Course | undefined> {
    const courses = await this.resolve.courseRepo.getAll();
    const ds = new CourseDs();
    return courses.find((c) => ds.includesModule(c, command.moduleId));
  }
}
