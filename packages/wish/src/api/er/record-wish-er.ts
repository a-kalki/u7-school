import type { ErMeta } from '@u7-scl/core/api';
import { EventReaction } from '@u7-scl/core/api';
import type { QuestionnaireCompleteEvent } from '@u7-scl/questionnaire/domain';
import type { WishApiModuleResolver } from '#domain/module';
import { WishAr } from '#domain/wish/a-root';

/** Метаданные реакции записи желания. */
export interface RecordWishErMeta
  extends ErMeta<QuestionnaireCompleteEvent<{ courseId: string }>> {
  erName: 'record-wish';
}

/**
 * Реакция на завершение анкеты желания.
 * Фиксирует желание пользователя пройти курс.
 */
export class RecordWishEr extends EventReaction<
  RecordWishErMeta,
  WishApiModuleResolver
> {
  protected readonly eventName = 'questionnaire:complete' as const;
  protected readonly erName = 'record-wish' as const;
  protected readonly erLabel =
    'Зафиксировать желание по завершении анкеты' as const;

  async handle(event: RecordWishErMeta['event']): Promise<void> {
    const courseId = event.ownerInfo.courseId;
    const userId = event.payload.respondentId;

    // Идемпотентность: если желание уже выражено — ничего не делаем.
    const existing = await this.resolve.wishRepo.getByUserAndCourse(
      userId,
      courseId,
    );
    if (existing && existing.status === 'expressed') {
      return;
    }

    const wish = WishAr.express(userId, courseId);
    await this.resolve.wishRepo.save(wish.state);
  }
}
