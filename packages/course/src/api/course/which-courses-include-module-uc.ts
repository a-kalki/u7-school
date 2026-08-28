import * as v from 'valibot';
import {
  type WhichCoursesIncludeModuleCmd,
  type WhichCoursesIncludeModuleCmdMeta,
  WhichCoursesIncludeModuleCmdSchema,
} from '#domain/course/commands/which-courses-include-module-cmd';
import { CourseDs } from '#domain/course-ds';
import { CourseUseCase } from '../course-uc';

/**
 * Use-case исторической принадлежности модуля курсам.
 *
 * Какие из courseIds включают модуль в свою программу — в т.ч. исторически
 * (форки, архивные курсы): курс берётся в любом статусе. Несуществующие
 * courseId пропускаются без ошибки. Связь модуль↔курс — через CourseDs.
 */
export class WhichCoursesIncludeModuleUc extends CourseUseCase<WhichCoursesIncludeModuleCmdMeta> {
  protected readonly ucName = 'which-courses-include-module' as const;
  protected readonly ucLabel =
    'Какие курсы включают модуль (исторически)' as const;
  protected readonly arMeta = {
    arName: 'Course' as const,
    arLabel: 'Курс' as const,
  };
  protected readonly type = 'query' as const;
  protected readonly requiresAuth = false as const;
  protected readonly inputSchema = WhichCoursesIncludeModuleCmdSchema;
  protected readonly outputSchema = v.array(v.string());

  async execute(
    command: WhichCoursesIncludeModuleCmd,
    _actorId?: string,
  ): Promise<string[]> {
    if (command.courseIds.length === 0) {
      return [];
    }

    const ds = new CourseDs();
    const matched: string[] = [];
    for (const courseId of command.courseIds) {
      const course = await this.resolve.courseRepo.getByUuid(courseId);
      if (course && ds.includesModule(course, command.moduleId)) {
        matched.push(courseId);
      }
    }
    return matched;
  }
}
