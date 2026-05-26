import { ModuleAr } from '#domain/module/a-root';
import type {
  GetModuleCmd,
  GetModuleCmdMeta,
} from '#domain/module/commands/get-module-cmd';
import { GetModuleCmdSchema } from '#domain/module/commands/get-module-cmd';
import type { Module } from '#domain/module/entity';
import { ModuleSchema } from '#domain/module/entity';
import { CourseUseCase } from '../course-uc';

/**
 * Use-case получения модуля по UUID.
 */
export class GetModuleUc extends CourseUseCase<GetModuleCmdMeta> {
  protected readonly ucName = 'get-module' as const;
  protected readonly ucLabel = 'Получить модуль по UUID' as const;
  protected readonly arMeta = {
    arName: ModuleAr.arName as 'Module',
    arLabel: ModuleAr.arLabel as 'Модуль',
  };
  protected readonly type = 'query' as const;
  protected readonly requiresAuth = false as const;
  protected readonly inputSchema = GetModuleCmdSchema;
  protected readonly outputSchema = ModuleSchema;

  async execute(command: GetModuleCmd, actorId?: string): Promise<Module> {
    const module = await this.getModule(command.uuid);
    const actor = actorId ? await this.getUser(actorId, actorId) : undefined;
    return this.getOutModule(module, actor);
  }
}
