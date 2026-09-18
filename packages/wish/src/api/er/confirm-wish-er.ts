import type { ErMeta } from '@u7-scl/core/api';
import { EventReaction } from '@u7-scl/core/api';
import { isoNow } from '@u7-scl/core/shared';
import type { QuestionnaireCompleteEvent } from '@u7-scl/questionnaire/domain';
import type { WishApiModuleResolver } from '#domain/module';
import { WishAr } from '#domain/wish/a-root';
import type { WishTarget } from '#domain/wish/entity';
import type { WishConfirmedEvent } from '#domain/wish/events';

/** Метаданные реакции подтверждения желания. */
export interface ConfirmWishErMeta
  extends ErMeta<QuestionnaireCompleteEvent<{ courseId: string }>> {
  erName: 'confirm-wish';
}

/**
 * Реакция на завершение анкетной ветки желания.
 * Желание в `pending` подтверждается (pending → confirmed);
 * любое другое состояние игнорируется (идемпотентность).
 *
 * После подтверждения публикует wish.confirmed — уведомление
 * менторам курса рендерит UI-сторя wish-confirmed (контроллер
 * courses); ER только фиксирует факт и адресует по сущности.
 */
export class ConfirmWishEr extends EventReaction<
  ConfirmWishErMeta,
  WishApiModuleResolver
> {
  protected readonly eventNames = ['questionnaire:complete'] as const;
  protected readonly erName = 'confirm-wish' as const;
  protected readonly erLabel =
    'Подтвердить желание по завершении анкеты' as const;

  async handle(event: ConfirmWishErMeta['event']): Promise<void> {
    const target: WishTarget = {
      kind: 'course',
      courseId: event.ownerInfo.courseId,
    };
    const userId = event.payload.respondentId;

    const state = await this.resolve.wishRepo.getByUserAndTarget(
      userId,
      target,
    );

    // Идемпотентность: подтверждаем только ожидающее анкету желание
    // (вопрос «можно ли» решает агрегат — предикат, не статус-поле).
    const wish = state ? new WishAr(state) : undefined;
    if (!wish?.canConfirm()) {
      return;
    }

    wish.confirm();
    await this.resolve.wishRepo.save(wish.state);

    const confirmed: WishConfirmedEvent = {
      eventId: crypto.randomUUID(),
      eventName: 'wish.confirmed',
      occurredAt: isoNow(),
      aggregateName: 'Wish',
      aggregateId: wish.state.uuid,
      payload: { userId, courseId: target.courseId },
    };
    this.resolve.eventBus.publish(confirmed);
  }
}
