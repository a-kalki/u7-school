import { errConflict, errNotFound } from '@u7-scl/core/domain';
import { WishAr } from '#domain/wish/a-root';
import type {
  CreateCourseWishCmd,
  CreateCourseWishCmdMeta,
  CreateCourseWishOutput,
} from '#domain/wish/commands/create-course-wish-cmd';
import {
  CreateCourseWishCmdSchema,
  CreateCourseWishOutputSchema,
} from '#domain/wish/commands/create-course-wish-cmd';
import type { WishTarget } from '#domain/wish/entity';
import { isWishStatusActive } from '#domain/wish/entity';
import type {
  CourseNotFoundUcError,
  WishAlreadyExistsUcError,
} from '#domain/wish/errors';
import { findCoursePool } from '#domain/wish/pools/course-pool';
import { WishUseCase } from '../wish-uc';

/**
 * Use-case создания желания пройти курс.
 * Курс с пулом анкеты → желание в pending + запуск анкеты;
 * курс без пула → мгновенная фиксация (expressed).
 */
export class CreateCourseWishUc extends WishUseCase<CreateCourseWishCmdMeta> {
  protected readonly ucName = 'create-course-wish' as const;
  protected readonly ucLabel = 'Создать желание пройти курс' as const;
  protected readonly arMeta = {
    arName: WishAr.arName as 'Wish',
    arLabel: WishAr.arLabel as 'Желание',
  };
  protected readonly type = 'command' as const;
  protected readonly requiresAuth = true as const;
  protected readonly inputSchema = CreateCourseWishCmdSchema;
  protected readonly outputSchema = CreateCourseWishOutputSchema;

  async execute(
    command: CreateCourseWishCmd,
    actorId: string,
  ): Promise<CreateCourseWishOutput> {
    // 1. Курс должен существовать.
    const course = await this.resolve.courseFacade.getCourse(command.courseId);
    if (!course) {
      this.throwError(
        errNotFound<CourseNotFoundUcError>(
          'COURSE_NOT_FOUND',
          'Курс не найден',
          { courseId: command.courseId },
        ),
      );
    }

    // 2. Не более одного активного желания на пару (user, target).
    const target: WishTarget = { kind: 'course', courseId: command.courseId };
    const existing = await this.repo.getByUserAndTarget(actorId, target);

    if (existing && isWishStatusActive(existing.status)) {
      this.throwError(
        errConflict<WishAlreadyExistsUcError>(
          'WISH_ALREADY_EXISTS',
          'Желание уже выражено',
          { userId: actorId, courseId: command.courseId },
        ),
      );
    }

    // 3. Курс с пулом анкеты — анкетная ветка: pending + запуск анкеты.
    const pool = findCoursePool(command.courseId);
    if (pool) {
      const wish = WishAr.pending(actorId, target);
      await this.repo.save(wish.state);
      await this.resolve.questionnaireFacade.startStandard<{
        courseId: string;
      }>(actorId, pool, { courseId: command.courseId });
      return { outcome: 'questionnaire' };
    }

    // 4. Курс без пула — мгновенная фиксация.
    const wish = WishAr.express(actorId, target);
    await this.repo.save(wish.state);

    return { outcome: 'instant' };
  }
}
