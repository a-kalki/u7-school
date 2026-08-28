import type { ErMeta } from '@u7-scl/core/api';
import { EventReaction } from '@u7-scl/core/api';
import type { StreamCreatedEvent } from '@u7-scl/stream/domain';
import type { WishApiModuleResolver } from '#domain/module';
import type { Wish } from '#domain/wish/entity';
import type { WishInviteEvent } from '#domain/wish/events';

/** Метаданные реакции приглашения желающих при открытии набора. */
export interface InviteWishersErMeta extends ErMeta<StreamCreatedEvent> {
  erName: 'invite-wishers';
}

/**
 * Реакция на создание потока (открытие набора).
 *
 * Course-ветка: желания на курс зовутся только на поток первого модуля
 * курса (place.isFirst); набор на стартовый модуль — реализация course-желания.
 * Module-ветка: желания на модуль зовутся на поток любого модуля
 * (ретейкеры, «следующий модуль»).
 * Историческая идентичность (форки) решается только фасадом курсов;
 * в событии уходит id из желания — cancel-маршрут работает по нему.
 * Пользователь без профиля (нет telegramId) — пропуск.
 */
export class InviteWishersEr extends EventReaction<
  InviteWishersErMeta,
  WishApiModuleResolver
> {
  protected readonly eventName = 'stream.created' as const;
  protected readonly erName = 'invite-wishers' as const;
  protected readonly erLabel = 'Пригласить желающих при открытии набора';

  async handle(event: InviteWishersErMeta['event']): Promise<void> {
    const { streamId, moduleId } = event.payload;

    // Место модуля потока в опубликованном курсе.
    // undefined — модуль вне опубликованных программ: course-ветка молчит.
    const place = await this.resolve.courseFacade.getModulePlace(moduleId);

    // Course-ветка — только набор на стартовый модуль курса.
    if (place?.isFirst) {
      const candidates = await this.resolve.wishRepo.findAllByKind('course', [
        'expressed',
        'confirmed',
      ]);
      const courseCandidates = candidates.filter(
        (w): w is Wish & { target: { kind: 'course'; courseId: string } } =>
          w.target.kind === 'course',
      );
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
        await this.#invite(wish, streamId, {
          wishKind: 'course',
          courseId: wish.target.courseId,
        });
      }
    }

    // Module-ветка — поток на любой модуль.
    const candidates = await this.resolve.wishRepo.findAllByKind('module', [
      'expressed',
      'confirmed',
    ]);
    if (candidates.length > 0) {
      const moduleCandidates = candidates.filter(
        (w): w is Wish & { target: { kind: 'module'; moduleId: string } } =>
          w.target.kind === 'module',
      );
      const matched = new Set(
        await this.resolve.courseFacade.whichModulesAreSame(
          moduleId,
          moduleCandidates.map((w) => w.target.moduleId),
        ),
      );
      for (const wish of moduleCandidates) {
        if (!matched.has(wish.target.moduleId)) {
          continue;
        }
        await this.#invite(wish, streamId, {
          wishKind: 'module',
          moduleId: wish.target.moduleId,
        });
      }
    }
  }

  /** Публикация wish:invite для совпавшего желания (без профиля — пропуск). */
  async #invite(
    wish: Wish,
    streamId: string,
    target:
      | { wishKind: 'course'; courseId: string }
      | {
          wishKind: 'module';
          moduleId: string;
        },
  ): Promise<void> {
    const user = await this.resolve.userFacade.getUserByUuid(wish.userId);
    if (!user) {
      return;
    }

    const event: WishInviteEvent = {
      eventId: crypto.randomUUID(),
      eventName: 'wish:invite',
      occurredAt: new Date().toISOString(),
      aggregateName: 'Wish',
      aggregateId: wish.uuid,
      payload: {
        wishId: wish.uuid,
        streamId,
        userId: wish.userId,
        telegramId: user.telegramId,
        wishKind: target.wishKind,
        ...(target.wishKind === 'course'
          ? { courseId: target.courseId }
          : { moduleId: target.moduleId }),
      },
    };
    this.resolve.eventBus.publish(event);
  }
}
