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
 * Желания пользователя на курсы, в программу которых входит модуль потока
 * переходят expressed|confirmed → fulfilled; остальные состояния
 * игнорируются (идемпотентность).
 */
export class FulfillWishEr extends EventReaction<
  FulfillWishErMeta,
  WishApiModuleResolver
> {
  protected readonly eventName = 'student.enrolled' as const;
  protected readonly erName = 'fulfill-wish' as const;
  protected readonly erLabel =
    'Отметить желание пройти курс реализованным' as const;

  async handle(event: FulfillWishErMeta['event']): Promise<void> {
    const { userId, moduleId } = event.payload;

    const wishes = await this.resolve.wishRepo.getByUser(userId);

    // Кандидаты: активные желания на курсы.
    const candidates = wishes.filter(
      (w): w is Wish & { target: { kind: 'course'; courseId: string } } =>
        w.target.kind === 'course' &&
        (w.status === 'expressed' || w.status === 'confirmed'),
    );
    if (candidates.length === 0) {
      return;
    }

    // Один батч-запрос: какие из курсов кандидатов содержат модуль потока.
    const matched = new Set(
      await this.resolve.courseFacade.filterCoursesContainingModule(
        moduleId,
        candidates.map((w) => w.target.courseId),
      ),
    );

    for (const wish of candidates) {
      if (!matched.has(wish.target.courseId)) {
        continue;
      }
      const ar = new WishAr(wish);
      ar.fulfill();
      await this.resolve.wishRepo.save(ar.state);
    }
  }
}
