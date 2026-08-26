import { errConflict, errNotFound } from '@u7-scl/core/domain';
import { WishAr } from '#domain/wish/a-root';
import type {
  ExpressWishCmd,
  ExpressWishCmdMeta,
  ExpressWishOutput,
} from '#domain/wish/commands/express-wish-cmd';
import {
  ExpressWishCmdSchema,
  ExpressWishOutputSchema,
} from '#domain/wish/commands/express-wish-cmd';
import type { WishTarget } from '#domain/wish/entity';
import type {
  CourseNotFoundUcError,
  WishAlreadyExistsUcError,
} from '#domain/wish/errors';
import {
  hasQuestionnaire,
  wishQuestionnairePool,
} from '#domain/wish/wish-questionnaire';
import { WishUseCase } from '../wish-uc';

/**
 * Use-case выражения желания пройти курс.
 * Две ветки: мгновенная фиксация (курс без анкеты) или запуск анкеты.
 */
export class ExpressWishUc extends WishUseCase<ExpressWishCmdMeta> {
  protected readonly ucName = 'express-wish' as const;
  protected readonly ucLabel = 'Выразить желание пройти курс' as const;
  protected readonly arMeta = {
    arName: WishAr.arName as 'Wish',
    arLabel: WishAr.arLabel as 'Желание',
  };
  protected readonly type = 'command' as const;
  protected readonly requiresAuth = true as const;
  protected readonly inputSchema = ExpressWishCmdSchema;
  protected readonly outputSchema = ExpressWishOutputSchema;

  async execute(
    command: ExpressWishCmd,
    actorId: string,
  ): Promise<ExpressWishOutput> {
    const target: WishTarget = { kind: 'course', courseId: command.courseId };

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

    // 2. Нельзя выразить желание повторно.
    const existing = await this.repo.getByUserAndTarget(actorId, target);
    if (existing && existing.status === 'expressed') {
      this.throwError(
        errConflict<WishAlreadyExistsUcError>(
          'WISH_ALREADY_EXISTS',
          'Желание уже выражено',
          { userId: actorId, courseId: command.courseId },
        ),
      );
    }

    // 3. С анкетой — запускаем анкету (желание создаст ER record-wish).
    if (hasQuestionnaire(command.courseId)) {
      await this.resolve.questionnaireFacade.startStandard<{
        courseId: string;
      }>(actorId, wishQuestionnairePool, { courseId: command.courseId });
      return { outcome: 'questionnaire' };
    }

    // Без анкеты — фиксируем желание мгновенно.
    const wish = WishAr.express(actorId, target);
    await this.repo.save(wish.state);

    return { outcome: 'instant' };
  }
}
