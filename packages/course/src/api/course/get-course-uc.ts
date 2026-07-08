import { errNotFound } from '@u7-scl/core/domain';
import type { CourseNotFoundUcError } from '#domain/course/commands/errors';
import {
  type GetCourseCmd,
  type GetCourseCmdMeta,
  GetCourseCmdSchema,
} from '#domain/course/commands/get-course-cmd';
import type { Course } from '#domain/course/entity';
import { CourseSchema } from '#domain/course/entity';
import { CourseUseCase } from '../course-uc';

/**
 * Use-case получения курса по UUID.
 * Доступен всем (авторизация не требуется).
 */
export class GetCourseUc extends CourseUseCase<GetCourseCmdMeta> {
  protected readonly ucName = 'get-course' as const;
  protected readonly ucLabel = 'Получить курс по UUID' as const;
  protected readonly arMeta = {
    arName: 'Course' as const,
    arLabel: 'Курс' as const,
  };
  protected readonly type = 'query' as const;
  protected readonly requiresAuth = false as const;
  protected readonly inputSchema = GetCourseCmdSchema;
  protected readonly outputSchema = CourseSchema;

  async execute(command: GetCourseCmd, _actorId?: string): Promise<Course> {
    const course = await this.resolve.courseRepo.getByUuid(command.uuid);
    if (!course) {
      this.throwError(
        errNotFound<CourseNotFoundUcError>(
          'COURSE_NOT_FOUND',
          'Курс не найден',
          { uuid: command.uuid },
        ),
      );
    }
    return course;
  }
}
