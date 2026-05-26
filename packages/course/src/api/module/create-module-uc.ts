import { ModuleAr } from '#domain/module/a-root';
import {
  type CreateModuleCmd,
  type CreateModuleCmdMeta,
  CreateModuleCmdSchema,
} from '#domain/module/commands/create-module-cmd';
import type { Module } from '#domain/module/entity';
import { ModuleSchema } from '#domain/module/entity';
import { ModulePolicy } from '#domain/module/policy';
import { CourseUseCase } from '../course-uc';

/**
 * Use-case создания модуля (этап 1).
 * Принимает title, description.
 * authorId берётся из actorId.
 * Требует прав MENTOR.
 */
export class CreateModuleUc extends CourseUseCase<CreateModuleCmdMeta> {
  protected readonly ucName = 'create-module' as const;
  protected readonly ucLabel = 'Создать модуль' as const;
  protected readonly arMeta = {
    arName: ModuleAr.arName as 'Module',
    arLabel: ModuleAr.arLabel as 'Модуль',
  };
  protected readonly type = 'command' as const;
  protected readonly requiresAuth = true as const;
  protected readonly inputSchema = CreateModuleCmdSchema;
  protected readonly outputSchema = ModuleSchema;

  async execute(command: CreateModuleCmd, actorId: string): Promise<Module> {
    const actor = await this.getActor(actorId);

    if (!ModulePolicy.canCreate(actor)) {
      this.throwAccessDenied('Недостаточно прав для создания модуля');
    }

    const ar = ModuleAr.create(command.title, command.description, actorId);
    await this.resolve.courseRepo.save(ar.state);

    return ar.state;
  }
}
