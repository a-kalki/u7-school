import type { ErMeta } from '@u7-scl/core/api';
import { EventReaction } from '@u7-scl/core/api';
import type { QuestionnaireAbandonEvent } from '@u7-scl/questionnaire/domain';
import type { WishApiModuleResolver } from '#domain/module';
import { WishAr } from '#domain/wish/a-root';
import type { WishTarget } from '#domain/wish/entity';

/** Метаданные реакции бросания желания. */
export interface AbandonWishErMeta
  extends ErMeta<QuestionnaireAbandonEvent<{ courseId: string }>> {
  erName: 'abandon-wish';
}

/**
 * Реакция на прерывание анкеты желания.
 * Желание в `pending` помечается брошенным (pending → abandoned);
 * любое другое состояние игнорируется (идемпотентность).
 */
export class AbandonWishEr extends EventReaction<
  AbandonWishErMeta,
  WishApiModuleResolver
> {
  protected readonly eventName = 'questionnaire:abandon' as const;
  protected readonly erName = 'abandon-wish' as const;
  protected readonly erLabel = 'Бросить желание при прерывании анкеты' as const;

  async handle(event: AbandonWishErMeta['event']): Promise<void> {
    const target: WishTarget = {
      kind: 'course',
      courseId: event.ownerInfo.courseId,
    };
    const userId = event.payload.respondentId;

    const state = await this.resolve.wishRepo.getByUserAndTarget(
      userId,
      target,
    );

    // Идемпотентность: бросаем только ожидающее анкету желание.
    if (!state || state.status !== 'pending') {
      return;
    }

    const wish = new WishAr(state);
    wish.abandon();
    await this.resolve.wishRepo.save(wish.state);
  }
}
