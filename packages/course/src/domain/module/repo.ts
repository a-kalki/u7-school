import type { Status } from '../status';
import type { Module } from './entity';

/** Параметры фильтрации и сортировки списка модулей */
export interface ModuleListFilter {
  status?: Status;
  authorId?: string;
  title?: string;
  tags?: string[];
  sort?: string;
  limit?: number;
}

/** Интерфейс репозитория модулей */
export interface ModuleRepo {
  save(module: Module): Promise<void>;
  getByUuid(uuid: string): Promise<Module | undefined>;
  getAll(filter?: ModuleListFilter): Promise<Module[]>;
}
