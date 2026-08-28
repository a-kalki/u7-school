import type { Wish, WishStatus, WishTarget } from './entity';

/** Интерфейс репозитория желаний. */
export interface WishRepo {
  /** Сохранить желание. */
  save(state: Wish): Promise<void>;

  /** Получить желание по UUID. */
  getByUuid(uuid: string): Promise<Wish | undefined>;

  /** Получить последнее желание пользователя по цели. */
  getByUserAndTarget(
    userId: string,
    target: WishTarget,
  ): Promise<Wish | undefined>;

  /** Получить все желания пользователя по цели (в любом статусе). */
  findAllByUserAndTarget(userId: string, target: WishTarget): Promise<Wish[]>;

  /** Получить все желания пользователя. */
  getByUser(userId: string): Promise<Wish[]>;

  /**
   * Все желания по виду цели (независимо от пользователя).
   * statuses не задан — все статусы; задан — фильтр на стороне хранилища.
   * Идентичность цели (форки) решается фасадом курсов, не выборкой.
   */
  findAllByKind(
    kind: 'course' | 'module',
    statuses?: WishStatus[],
  ): Promise<Wish[]>;
}
