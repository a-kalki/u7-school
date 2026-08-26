import type { Wish, WishTarget } from './entity';

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

  /** Получить все желания пользователя. */
  getByUser(userId: string): Promise<Wish[]>;
}
