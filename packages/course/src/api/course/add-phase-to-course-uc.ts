import { errNotFound } from '@u7-scl/core/domain';
import { CourseAr } from '#domain/course/a-root';
import {
  type AddPhaseToCourseCmd,
  type AddPhaseToCourseCmdMeta,
  AddPhaseToCourseCmdSchema,
} from '#domain/course/commands/add-phase-to-course-cmd';
import type { CourseNotFoundUcError } from '#domain/course/commands/errors';
import type { Course } from '#domain/course/entity';
import { CourseSchema } from '#domain/course/entity';
import { CoursePolicy } from '#domain/course/policy';
import { CourseUseCase } from '../course-uc';

/**
 * Use-case добавления фазы в курс.
 * Требует прав ADMIN или автор курса.
 */
export class AddPhaseToCourseUc extends CourseUseCase<AddPhaseToCourseCmdMeta> {
  protected readonly ucName = 'add-phase-to-course' as const;
  protected readonly ucLabel = 'Добавить фазу в курс' as const;
  protected readonly arMeta = {
    arName: CourseAr.arName as 'Course',
    arLabel: CourseAr.arLabel as 'Курс',
  };
  protected readonly type = 'command' as const;
  protected readonly requiresAuth = true as const;
  protected readonly inputSchema = AddPhaseToCourseCmdSchema;
  protected readonly outputSchema = CourseSchema;

  async execute(
    command: AddPhaseToCourseCmd,
    actorId: string,
  ): Promise<Course> {
    const actor = await this.getActor(actorId);
    const course = await this.getCourse(command.courseId);

    if (!CoursePolicy.canEdit(actor, course)) {
      this.throwAccessDenied('Недостаточно прав для редактирования курса');
    }

    const ar = new CourseAr(course);
    ar.addPhase(command.title, command.track);
    await this.resolve.courseRepository.save(ar.state);

    return ar.state;
  }

  private async getCourse(uuid: string): Promise<Course> {
    const course = await this.resolve.courseRepository.getByUuid(uuid);
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
