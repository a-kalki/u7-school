import type { ErMeta } from '@u7-scl/core/api';
import { EventReaction } from '@u7-scl/core/api';
import type { QuestionnaireCompleteEvent } from '@u7-scl/questionnaire/domain';
import type { WishApiModuleResolver } from '#domain/module';
import { WishAr } from '#domain/wish/a-root';
import type { WishTarget } from '#domain/wish/entity';

/** Метаданные реакции подтверждения желания. */
export interface ConfirmWishErMeta
  extends ErMeta<QuestionnaireCompleteEvent<{ courseId: string }>> {
  erName: 'confirm-wish';
}

/**
 * Реакция на завершение анкетной ветки желания.
 * Желание в `pending` подтверждается (pending → confirmed);
 * любое другое состояние игнорируется (идемпотентность).
 */
export class ConfirmWishEr extends EventReaction<
  ConfirmWishErMeta,
  WishApiModuleResolver
> {
  protected readonly eventName = 'questionnaire:complete' as const;
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

    // Идемпотентность: подтверждаем только ожидающее анкету желание.
    if (!state || state.status !== 'pending') {
      return;
    }

    const wish = new WishAr(state);
    wish.confirm();
    await this.resolve.wishRepo.save(wish.state);
  }
}
