import type { WishStatus } from './entity';

/** Активные статусы желания — блокируют повторное создание на тот же target. */
const ACTIVE_WISH_STATUSES: readonly WishStatus[] = [
  'expressed',
  'pending',
  'confirmed',
] as const;

/**
 * Stateless-политика желания: ответы на вопросы о статусах.
 * Логика доменных прав — рядом с агрегатом, в UC только вызов.
 */
export const WishPolicy = {
  /** Активен ли статус желания (expressed / pending / confirmed). */
  isActive(status: WishStatus): boolean {
    return ACTIVE_WISH_STATUSES.includes(status);
  },
};
