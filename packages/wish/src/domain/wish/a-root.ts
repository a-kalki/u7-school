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

  // ── Предикаты переходов ──
  // Единственное место знания «из какого статуса возможен переход».
  // Потребители (UC/ER) спрашивают предикат — не читают статус напрямую.

  /** Подтверждаемо ли желание (только pending — анкетная ветка). */
  canConfirm(): boolean {
    return this._state.status === 'pending';
  }

  /** Бросаемо ли желание (только pending — анкета прервана). */
  canAbandon(): boolean {
    return this._state.status === 'pending';
  }

  /** Отменяемо ли желание (expressed | confirmed). */
  canCancel(): boolean {
    return this.canFulfill();
  }

  /** Реализуемо ли желание (expressed | confirmed — зачисление на поток). */
  canFulfill(): boolean {
    return (
      this._state.status === 'expressed' || this._state.status === 'confirmed'
    );
  }

  // ── Переходы ──

  /** Подтверждает желание: pending → confirmed (анкета завершена). */
  confirm(): void {
    if (!this.canConfirm()) {
      this.throwBadRequest('Подтвердить можно только ожидающее анкету желание');
    }
    this.safeUpdate({ status: 'confirmed' });
  }

  /** Помечает желание брошенным: pending → abandoned (анкета брошена). */
  abandon(): void {
    if (!this.canAbandon()) {
      this.throwBadRequest('Бросить можно только ожидающее анкету желание');
    }
    this.safeUpdate({ status: 'abandoned' });
  }

  /**
   * Отменяет желание: expressed | confirmed → cancelled.
   * Для pending отмена недоступна — только abandon.
   */
  cancel(): void {
    if (!this.canCancel()) {
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
    if (!this.canFulfill()) {
      this.throwBadRequest(
        'Реализовать можно только выраженное или подтверждённое желание',
      );
    }
    this.safeUpdate({ status: 'fulfilled' });
  }
}
