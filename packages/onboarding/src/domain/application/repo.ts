import type { Application } from "./entity";

/** Параметры фильтрации списка заявок */
export interface ApplicationListFilter {
  limit?: number;
  status?: string;
  sort?: string;
}

/** Интерфейс репозитория заявок */
export interface ApplicationRepo {
  save(application: Application): Promise<void>;
  getByUuid(uuid: string): Promise<Application | undefined>;
  getByUserId(userId: string): Promise<Application | undefined>;
  getAll(filter?: ApplicationListFilter): Promise<Application[]>;
  hasApplicationForUser(userId: string): Promise<boolean>;
}
