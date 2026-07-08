import { ModuleAr } from '#domain/module/a-root';
import {
  type PublishModuleCmd,
  type PublishModuleCmdMeta,
  PublishModuleCmdSchema,
} from '#domain/module/commands/publish-module-cmd';
import type { Module } from '#domain/module/entity';
import { ModuleSchema } from '#domain/module/entity';
import { ModulePolicy } from '#domain/module/policy';
import { CourseUseCase } from '../course-uc';

/**
 * Use-case публикации модуля (этап 4).
 * Публиковать может автор или ADMIN.
 */
export class PublishModuleUc extends CourseUseCase<PublishModuleCmdMeta> {
  protected readonly ucName = 'publish-module' as const;
  protected readonly ucLabel = 'Опубликовать модуль (этап 4)' as const;
  protected readonly arMeta = {
    arName: ModuleAr.arName as 'Module',
    arLabel: ModuleAr.arLabel as 'Модуль',
  };
  protected readonly type = 'command' as const;
  protected readonly requiresAuth = true as const;
  protected readonly inputSchema = PublishModuleCmdSchema;
  protected readonly outputSchema = ModuleSchema;

  async execute(command: PublishModuleCmd, actorId: string): Promise<Module> {
    const module = await this.getModule(command.moduleId);
    const actor = await this.getActor(actorId);

    if (!ModulePolicy.canEdit(actor, module)) {
      this.throwAccessDenied('Недостаточно прав для редактирования модуля');
    }

    const ar = new ModuleAr(module);
    ar.publish();
    await this.resolve.moduleRepo.save(ar.state);

    return ar.state;
  }
}
