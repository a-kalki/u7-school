import { errNotFound } from '@u7-scl/core/domain';
import { CourseAr } from '#domain/course/a-root';
import {
  type AddModuleToCourseCmd,
  type AddModuleToCourseCmdMeta,
  AddModuleToCourseCmdSchema,
} from '#domain/course/commands/add-module-to-course-cmd';
import type { CourseNotFoundUcError } from '#domain/course/commands/errors';
import type { Course } from '#domain/course/entity';
import { CourseSchema } from '#domain/course/entity';
import { CoursePolicy } from '#domain/course/policy';
import { CourseUseCase } from '../course-uc';

/**
 * Use-case добавления модуля в фазу курса.
 * Требует прав ADMIN или автор курса.
 */
export class AddModuleToCourseUc extends CourseUseCase<AddModuleToCourseCmdMeta> {
  protected readonly ucName = 'add-module-to-course' as const;
  protected readonly ucLabel = 'Добавить модуль в курс' as const;
  protected readonly arMeta = {
    arName: CourseAr.arName as 'Course',
    arLabel: CourseAr.arLabel as 'Курс',
  };
  protected readonly type = 'command' as const;
  protected readonly requiresAuth = true as const;
  protected readonly inputSchema = AddModuleToCourseCmdSchema;
  protected readonly outputSchema = CourseSchema;

  async execute(
    command: AddModuleToCourseCmd,
    actorId: string,
  ): Promise<Course> {
    const actor = await this.getActor(actorId);
    const course = await this.getCourse(command.courseId);

    if (!CoursePolicy.canEdit(actor, course)) {
      this.throwAccessDenied('Недостаточно прав для редактирования курса');
    }

    const ar = new CourseAr(course);
    ar.addModuleToPhase(command.phaseTitle, command.moduleId);
    await this.resolve.courseRepo.save(ar.state);

    return ar.state;
  }

  private async getCourse(uuid: string): Promise<Course> {
    const course = await this.resolve.courseRepo.getByUuid(uuid);
    if (!course) {
      this.throwError(
        errNotFound<CourseNotFoundUcError>(
          'COURSE_NOT_FOUND',
          'Курс не найден',
          {
            uuid,
          },
        ),
      );
    }
    return course;
  }
}
