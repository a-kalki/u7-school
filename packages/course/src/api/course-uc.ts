import { type UcMeta, UseCase } from '@u7/core/api';
import { errAccessDenied, errNotFound } from '@u7/core/domain';
import type { User } from '@u7/user/domain';
import { CourseAr } from '#domain/course/a-root';
import type {
  CourseAccessDeniedUcError,
  CourseNotFoundUcError,
} from '#domain/course/commands/errors';
import type { Course } from '#domain/course/entity';
import { LessonAr } from '#domain/lesson/a-root';
import type { Lesson } from '#domain/lesson/entity';
import type { CourseApiModuleResolver } from '#domain/module';
import { StepAr } from '#domain/step/a-root';
import type { Step } from '#domain/step/entity';

/**
 * Базовый класс для всех use-case'ов модуля курсов.
 */
export abstract class CourseUseCase<TMeta extends UcMeta> extends UseCase<
  TMeta,
  CourseApiModuleResolver
> {
  protected async getCourse(courseId: string): Promise<Course> {
    const course = await this.resolve.courseRepo.getByUuid(courseId);
    if (!course) {
      this.throwError(
        errNotFound<CourseNotFoundUcError>(
          'COURSE_NOT_FOUND',
          'Курс не найден',
          { uuid: courseId },
        ),
      );
    }
    return course;
  }

  protected async getActor(actorId: string): Promise<User> {
    const actor = await this.getUser(actorId, actorId);
    if (!actor) {
      this.throwError(
        errAccessDenied<CourseAccessDeniedUcError>(
          'COURSE_ACCESS_DENIED',
          'Пользователь не найден',
          undefined,
        ),
      );
    }
    return actor;
  }

  protected throwAccessDenied(
    message = 'Недостаточно прав для выполнения действия',
  ): never {
    this.throwError(
      errAccessDenied<CourseAccessDeniedUcError>(
        'COURSE_ACCESS_DENIED',
        message,
        undefined,
      ),
    );
  }

  // ──────────────── Выходные хелперы ────────────────

  /**
   * Возвращает курс в читаемом виде через CourseAr.getVisibleFor.
   * Бросает ACCESS_DENIED если курс не виден актору.
   */
  protected getOutCourse(course: Course, actor?: User): Course {
    const ar = new CourseAr(course);
    const result = ar.getVisibleFor(actor);
    if (!result) {
      this.throwError(
        errAccessDenied<CourseAccessDeniedUcError>(
          'COURSE_ACCESS_DENIED',
          'Нет доступа к курсу',
          undefined,
        ),
      );
    }
    return result;
  }

  /**
   * Возвращает урок в читаемом виде через LessonAr.getVisibleFor.
   * Бросает ACCESS_DENIED если урок не виден актору.
   */
  protected async getOutLesson(lesson: Lesson, actor?: User): Promise<Lesson> {
    const course = await this.getCourse(lesson.courseId);
    const ar = new LessonAr(lesson);
    const result = ar.getVisibleFor(actor, course);
    if (!result) {
      this.throwError(
        errAccessDenied(
          'LESSON_ACCESS_DENIED' as never,
          'Нет доступа к уроку',
          {
            uuid: lesson.uuid,
          },
        ),
      );
    }
    return result;
  }

  /**
   * Возвращает шаг в читаемом виде через StepAr.getVisibleFor.
   * Бросает ACCESS_DENIED если шаг не виден актору.
   */
  protected async getOutStep(step: Step, actor?: User): Promise<Step> {
    const course = await this.getCourse(step.courseId);
    const ar = new StepAr(step);
    const result = ar.getVisibleFor(actor, course);
    if (!result) {
      this.throwError(
        errAccessDenied('STEP_ACCESS_DENIED' as never, 'Нет доступа к шагу', {
          uuid: step.uuid,
        }),
      );
    }
    return result;
  }

  /**
   * Получает пользователя по ID (делегирует фасаду).
   */
  protected async getUser(
    userId: string,
    actorId?: string,
  ): Promise<User | undefined> {
    return this.resolve.userFacade.getUserByUuid(userId, actorId);
  }
}
