import type { User } from '@u7-scl/app/domain';
import { CourseAr } from '#domain/course/a-root';
import {
  type CreateCourseCmd,
  type CreateCourseCmdMeta,
  CreateCourseCmdSchema,
} from '#domain/course/commands/create-course-cmd';
import type { Course } from '#domain/course/entity';
import { CourseSchema } from '#domain/course/entity';
import { CoursePolicy } from '#domain/course/policy';
import { CourseUseCase } from '../course-uc';

/**
 * Use-case создания курса.
 */
export class CreateCourseUc extends CourseUseCase<CreateCourseCmdMeta> {
  protected readonly ucName = 'create-course' as const;
  protected readonly ucLabel = 'Создать курс' as const;
  protected readonly arMeta = {
    arName: CourseAr.arName as 'Course',
    arLabel: CourseAr.arLabel as 'Курс',
  };
  protected readonly type = 'command' as const;
  protected readonly requiresAuth = true as const;
  protected readonly inputSchema = CreateCourseCmdSchema;
  protected readonly outputSchema = CourseSchema;

  async execute(command: CreateCourseCmd, actor: User): Promise<Course> {
    if (!CoursePolicy.canCreate(actor)) {
      this.throwAccessDenied('Недостаточно прав для создания курса');
    }

    const ar = CourseAr.create(command.title, command.description, actor.uuid);
    await this.resolve.courseRepo.save(ar.state);

    return ar.state;
  }
}
