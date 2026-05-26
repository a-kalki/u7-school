import { JsonFileRepo } from '@u7-scl/core/infra';
import type { Module } from '#domain/module/entity';
import { ModuleSchema } from '#domain/module/entity';
import type { ModuleListFilter, ModuleRepo } from '#domain/module/repo';

/**
 * JSON-файловая реализация репозитория модулей.
 * Хранит данные в JSON-файле через {@link JsonFileRepo}.
 */
export class ModuleJsonRepo implements ModuleRepo {
  readonly #repo: JsonFileRepo<Module>;

  constructor(filePath = 'data/courses/modules.json') {
    this.#repo = new JsonFileRepo(ModuleSchema, filePath);
  }

  async save(module: Module): Promise<void> {
    const all = await this.#repo.readAll();
    const idx = all.findIndex((c) => c.uuid === module.uuid);
    if (idx !== -1) {
      all[idx] = module;
    } else {
      all.push(module);
    }
    await this.#repo.writeAll(all);
  }

  async getByUuid(uuid: string): Promise<Module | undefined> {
    const all = await this.#repo.readAll();
    return all.find((c) => c.uuid === uuid);
  }

  async getAll(filter?: ModuleListFilter): Promise<Module[]> {
    let modules = await this.#repo.readAll();

    if (filter) {
      if (filter.status) {
        modules = modules.filter((c) => c.status === filter.status);
      }
      if (filter.authorId) {
        modules = modules.filter((c) => c.authorId === filter.authorId);
      }
      if (filter.title) {
        const lower = filter.title.toLowerCase();
        modules = modules.filter((c) => c.title.toLowerCase().includes(lower));
      }
      if (filter.tags && filter.tags.length > 0) {
        modules = modules.filter((c) =>
          c.tags?.some((t) => filter.tags?.includes(t)),
        );
      }
      if (filter.sort) {
        const [field, dir] = filter.sort.split(':') as [
          'createdAt' | 'title',
          'asc' | 'desc',
        ];
        const m = dir === 'asc' ? 1 : -1;
        modules.sort((a, b) => {
          const va = a[field];
          const vb = b[field];
          if (va! < vb!) return -1 * m;
          if (va! > vb!) return 1 * m;
          return 0;
        });
      }
      if (filter.limit !== undefined) {
        modules = modules.slice(0, filter.limit);
      }
    }

    return modules;
  }
}
