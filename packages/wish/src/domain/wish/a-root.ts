import { Aggregate } from '@u7-scl/core/domain';
import { isoNow } from '@u7-scl/core/shared';
import type { Wish, WishArMeta } from './entity';
import { WishSchema } from './entity';

/**
 * Агрегат Wish — фиксирует желание пользователя пройти курс.
 * Статусы: expressed (зафиксировано), cancelled (отменено),
 * fulfilled (реализовано — добавляется в треке C2).
 * Инвариант: отменить можно только выраженное желание (expressed).
 */
export class WishAr extends Aggregate<WishArMeta> {
  static readonly arName = 'Wish';
  static readonly arLabel = 'Желание';

  constructor(state: Wish) {
    super(state, WishSchema);
  }

  /** Фиксирует желание пользователя пройти курс (статус expressed). */
  static express(userId: string, courseId: string): WishAr {
    const candidate: Wish = {
      uuid: crypto.randomUUID(),
      userId,
      courseId,
      status: 'expressed',
      createdAt: isoNow(),
    };
    return new WishAr(candidate);
  }

  /** Отменяет желание (только из статуса expressed). */
  cancel(): void {
    if (this._state.status !== 'expressed') {
      this.throwBadRequest('Отменить можно только выраженное желание');
    }
    this.safeUpdate({ status: 'cancelled' });
  }
}
