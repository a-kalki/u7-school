import { Aggregate } from '@u7-scl/core/domain';
import { isoNow } from '@u7-scl/core/shared';
import type { Wish, WishArMeta, WishTarget } from './entity';
import { WishSchema } from './entity';

/**
 * Агрегат Wish — фиксирует желание пользователя в отношении цели (target).
 *
 * Жизненный цикл — две непересекающиеся ветки:
 * - мгновенная: expressed → cancelled | fulfilled;
 * - анкетная: pending → confirmed | abandoned, далее confirmed → cancelled | fulfilled.
 *
 * Инвариант: не более одного активного желания на пару (user, target)
 * обеспечивается UC при создании.
 */
export class WishAr extends Aggregate<WishArMeta> {
  static readonly arName = 'Wish';
  static readonly arLabel = 'Желание';

  constructor(state: Wish) {
    super(state, WishSchema);
  }

  /** Фиксирует желание мгновенно — курс без анкеты (статус expressed). */
  static express(userId: string, target: WishTarget): WishAr {
    const candidate: Wish = {
      uuid: crypto.randomUUID(),
      userId,
      target,
      status: 'expressed',
      createdAt: isoNow(),
    };
    return new WishAr(candidate);
  }

  /** Фиксирует желание в ожидании анкеты (статус pending). */
  static pending(userId: string, target: WishTarget): WishAr {
    const candidate: Wish = {
      uuid: crypto.randomUUID(),
      userId,
      target,
      status: 'pending',
      createdAt: isoNow(),
    };
    return new WishAr(candidate);
  }

  /** Подтверждает желание: pending → confirmed (анкета завершена). */
  confirm(): void {
    if (this._state.status !== 'pending') {
      this.throwBadRequest('Подтвердить можно только ожидающее анкету желание');
    }
    this.safeUpdate({ status: 'confirmed' });
  }

  /** Помечает желание брошенным: pending → abandoned (анкета брошена). */
  abandon(): void {
    if (this._state.status !== 'pending') {
      this.throwBadRequest('Бросить можно только ожидающее анкету желание');
    }
    this.safeUpdate({ status: 'abandoned' });
  }

  /**
   * Отменяет желание: expressed | confirmed → cancelled.
   * Для pending отмена недоступна — только abandon.
   */
  cancel(): void {
    if (
      this._state.status !== 'expressed' &&
      this._state.status !== 'confirmed'
    ) {
      this.throwBadRequest(
        'Отменить можно только выраженное или подтверждённое желание',
      );
    }
    this.safeUpdate({ status: 'cancelled' });
  }

  /**
   * Реализует желание: expressed | confirmed → fulfilled
   * (студент зачислен на поток курса — событие student.enrolled).
   * Для pending реализация недоступна — сначала confirm (анкета).
   */
  fulfill(): void {
    if (
      this._state.status !== 'expressed' &&
      this._state.status !== 'confirmed'
    ) {
      this.throwBadRequest(
        'Реализовать можно только выраженное или подтверждённое желание',
      );
    }
    this.safeUpdate({ status: 'fulfilled' });
  }
}
