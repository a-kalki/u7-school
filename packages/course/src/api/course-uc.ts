import { type UcMeta, UseCase } from '@u7-scl/core/api';
import { errAccessDenied, errNotFound } from '@u7-scl/core/domain';
import type { User } from '@u7-scl/user/domain';
import { LessonAr } from '#domain/lesson/a-root';
import type { Lesson } from '#domain/lesson/entity';
import type { CourseApiModuleResolver } from '#domain/module';
import { ModuleAr } from '#domain/module/a-root';
import type {
  ModuleAccessDeniedUcError,
  ModuleNotFoundUcError,
} from '#domain/module/commands/errors';
import type { Module } from '#domain/module/entity';
import { StepAr } from '#domain/step/a-root';
import type { Step } from '#domain/step/entity';

/**
 * Базовый класс для всех use-case'ов модуля курсов.
 */
export abstract class CourseUseCase<TMeta extends UcMeta> extends UseCase<
  TMeta,
  CourseApiModuleResolver
> {
  protected async getModule(moduleId: string): Promise<Module> {
    const module = await this.resolve.courseRepo.getByUuid(moduleId);
    if (!module) {
      this.throwError(
        errNotFound<ModuleNotFoundUcError>(
          'MODULE_NOT_FOUND',
          'Модуль не найден',
          { uuid: moduleId },
        ),
      );
    }
    return module;
  }

  protected async getActor(actorId: string): Promise<User> {
    const actor = await this.getUser(actorId, actorId);
    if (!actor) {
      this.throwError(
        errAccessDenied<ModuleAccessDeniedUcError>(
          'MODULE_ACCESS_DENIED',
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
      errAccessDenied<ModuleAccessDeniedUcError>(
        'MODULE_ACCESS_DENIED',
        message,
        undefined,
      ),
    );
  }

  // ──────────────── Выходные хелперы ────────────────

  /**
   * Возвращает модуль в читаемом виде через ModuleAr.getVisibleFor.
   * Бросает ACCESS_DENIED если модуль не виден актору.
   */
  protected getOutModule(module: Module, actor?: User): Module {
    const ar = new ModuleAr(module);
    const result = ar.getVisibleFor(actor);
    if (!result) {
      this.throwError(
        errAccessDenied<ModuleAccessDeniedUcError>(
          'MODULE_ACCESS_DENIED',
          'Нет доступа к модулю',
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
    const module = await this.getModule(lesson.moduleId);
    const ar = new LessonAr(lesson);
    const result = ar.getVisibleFor(actor, module);
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
    const module = await this.getModule(step.moduleId);
    const ar = new StepAr(step);
    const result = ar.getVisibleFor(actor, module);
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
