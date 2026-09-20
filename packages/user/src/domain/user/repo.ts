import type { User } from './entity';
import type { Role } from './roles';

/** Параметры фильтрации и сортировки списка пользователей */
export interface UserListFilter {
  limit?: number;
  role?: Role;
  name?: string;
  telegramId?: number;
  sort?: string;
}

/** Интерфейс репозитория пользователей */
export interface UserRepo {
  save(user: User): Promise<void>;
  getByUuid(uuid: string): Promise<User | undefined>;
  /** Пакетное чтение по набору UUID (один запрос, без N+1).
   *  Ненайденные — пропускаются. */
  getByUuids(uuids: string[]): Promise<User[]>;
  getByTelegramId(telegramId: number): Promise<User | undefined>;
  getAll(filter?: UserListFilter): Promise<User[]>;
  isTelegramIdTaken(telegramId: number): Promise<boolean>;
  isEmpty(): Promise<boolean>;
}
