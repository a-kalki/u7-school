import type { ErMeta } from '@u7-scl/core/api';
import { EventReaction } from '@u7-scl/core/api';
import type { StudentEnrolledEvent } from '@u7-scl/stream/domain';
import type { WishApiModuleResolver } from '#domain/module';
import { WishAr } from '#domain/wish/a-root';
import type { Wish } from '#domain/wish/entity';

/** Метаданные реакции реализации желания при зачислении. */
export interface FulfillWishErMeta extends ErMeta<StudentEnrolledEvent> {
  erName: 'fulfill-wish';
}

/**
 * Реакция на зачисление студента на поток.
 *
 * Course-wish: желания пользователя на курсы, в программу которых входит
 * модуль потока, переходят expressed|confirmed → fulfilled.
 * Module-wish: желания на модуль, исторически тот же (isSameModule),
 * что и модуль потока, — реализуются.
 * Остальные состояния игнорируются (идемпотентность).
 */
export class FulfillWishEr extends EventReaction<
  FulfillWishErMeta,
  WishApiModuleResolver
> {
  protected readonly eventName = 'student.enrolled' as const;
  protected readonly erName = 'fulfill-wish' as const;
  protected readonly erLabel = 'Отметить желание реализованным' as const;

  async handle(event: FulfillWishErMeta['event']): Promise<void> {
    const { userId, moduleId } = event.payload;

    const wishes = await this.resolve.wishRepo.getByUser(userId);

    // Кандидаты: активные желания обоих видов.
    const active = wishes.filter(
      (w) => w.status === 'expressed' || w.status === 'confirmed',
    );
    if (active.length === 0) {
      return;
    }

    const courseCandidates = active.filter(
      (w): w is Wish & { target: { kind: 'course'; courseId: string } } =>
        w.target.kind === 'course',
    );
    const moduleCandidates = active.filter(
      (w): w is Wish & { target: { kind: 'module'; moduleId: string } } =>
        w.target.kind === 'module',
    );

    // Course-ветка: один батч-запрос — какие из курсов кандидатов
    // включают модуль потока (в т.ч. исторически).
    if (courseCandidates.length > 0) {
      const matched = new Set(
        await this.resolve.courseFacade.whichCoursesIncludeModule(
          moduleId,
          courseCandidates.map((w) => w.target.courseId),
        ),
      );
      for (const wish of courseCandidates) {
        if (!matched.has(wish.target.courseId)) {
          continue;
        }
        await this.#fulfill(wish);
      }
    }

    // Module-ветка: идентичность модулей решает модуль курсов (isSameModule).
    for (const wish of moduleCandidates) {
      const same = await this.resolve.courseFacade.isSameModule(
        moduleId,
        wish.target.moduleId,
      );
      if (same) {
        await this.#fulfill(wish);
      }
    }
  }

  async #fulfill(wish: Wish): Promise<void> {
    const ar = new WishAr(wish);
    ar.fulfill();
    await this.resolve.wishRepo.save(ar.state);
  }
}
