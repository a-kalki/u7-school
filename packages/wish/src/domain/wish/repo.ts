import type { Wish } from './entity';

/** Интерфейс репозитория желаний. */
export interface WishRepo {
  /** Сохранить желание. */
  save(state: Wish): Promise<void>;

  /** Получить желание по UUID. */
  getByUuid(uuid: string): Promise<Wish | undefined>;

  /** Получить последнее желание пользователя по курсу. */
  getByUserAndCourse(
    userId: string,
    courseId: string,
  ): Promise<Wish | undefined>;

  /** Получить все желания пользователя. */
  getByUser(userId: string): Promise<Wish[]>;
}
