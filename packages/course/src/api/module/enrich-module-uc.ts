import { ModuleAr } from '#domain/module/a-root';
import {
  type EnrichModuleCmd,
  type EnrichModuleCmdMeta,
  EnrichModuleCmdSchema,
} from '#domain/module/commands/enrich-module-cmd';
import type { Module } from '#domain/module/entity';
import { ModuleSchema } from '#domain/module/entity';
import { ModulePolicy } from '#domain/module/policy';
import { CourseUseCase } from '../course-uc';

/**
 * Use-case обогащения модуля (этап 2).
 * Устанавливает дополнительные поля: targetAudience, goal, result и т.д.
 * Редактировать может автор или ADMIN.
 */
export class EnrichModuleUc extends CourseUseCase<EnrichModuleCmdMeta> {
  protected readonly ucName = 'enrich-module' as const;
  protected readonly ucLabel = 'Обогатить модуль' as const;
  protected readonly arMeta = {
    arName: ModuleAr.arName as 'Module',
    arLabel: ModuleAr.arLabel as 'Модуль',
  };
  protected readonly type = 'command' as const;
  protected readonly requiresAuth = true as const;
  protected readonly inputSchema = EnrichModuleCmdSchema;
  protected readonly outputSchema = ModuleSchema;

  async execute(command: EnrichModuleCmd, actorId: string): Promise<Module> {
    const module = await this.getModule(command.moduleId);
    const actor = await this.getActor(actorId);

    if (!ModulePolicy.canEdit(actor, module)) {
      this.throwAccessDenied('Недостаточно прав для редактирования модуля');
    }

    const ar = new ModuleAr(module);
    ar.enrich(command);
    await this.resolve.moduleRepo.save(ar.state);

    return ar.state;
  }
}
