import type { User } from '@u7-scl/app/domain';
import * as v from 'valibot';
import type {
  ListModulesCmd,
  ListModulesCmdMeta,
} from '#domain/module/commands/list-modules-cmd';
import { ListModulesCmdSchema } from '#domain/module/commands/list-modules-cmd';
import type { Module } from '#domain/module/entity';
import { ModuleSchema } from '#domain/module/entity';
import { CourseUseCase } from '../course-uc';

const ModulesListOutputSchema = v.array(ModuleSchema);

/**
 * Use-case получения списка модулей.
 * Без actor — только PUBLISHED. С actor — через getOutModule.
 */
export class ListModulesUc extends CourseUseCase<ListModulesCmdMeta> {
  protected readonly ucName = 'list-modules' as const;
  protected readonly ucLabel = 'Получить список модулей' as const;
  protected readonly arMeta = {
    arName: 'Module' as const,
    arLabel: 'Модуль' as const,
  };
  protected readonly type = 'query' as const;
  protected readonly requiresAuth = false as const;
  protected readonly inputSchema = ListModulesCmdSchema;
  protected readonly outputSchema = ModulesListOutputSchema;

  async execute(command: ListModulesCmd, actor?: User): Promise<Module[]> {
    // Актор приходит параметром (объект или undefined для анонимных запросов)

    const modules = await this.resolve.moduleRepo.getAll({
      status: command.status,
      authorId: command.authorId,
      title: command.title,
      tags: command.tags,
      sort: command.sort,
      limit: command.limit,
    });

    // Фильтруем каждый модуль через getOutModule
    const visible: Module[] = [];
    for (const mod of modules) {
      try {
        const out = this.getOutModule(mod, actor);
        visible.push(out);
      } catch {
        // Модуль не виден — пропускаем
      }
    }
    return visible;
  }
}
