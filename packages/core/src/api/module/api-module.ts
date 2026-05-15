import type { UcDocType, UseCase } from '#api/uc/use-case';
import { errBadRequest, throwError } from '#domain/errors/error-helpers';
import type { NoCommandFoundError } from '#domain/errors/errors';
import type { ApiModuleMeta, ModuleCommand } from '#domain/types';

export abstract class ApiModule<TMeta extends ApiModuleMeta, TResolve> {
  abstract readonly name: TMeta['name'];
  abstract readonly useCases: UseCase<ApiModuleMeta['ucMetas'], TResolve>[];

  protected resolve!: TResolve;

  // Кэш для быстрого поиска use-case по имени
  private useCaseMap = new Map<
    string,
    UseCase<ApiModuleMeta['ucMetas'], TResolve>
  >();

  init(resolve: TResolve) {
    this.resolve = resolve;
    for (const uc of this.useCases) {
      uc.init(resolve);
      this.useCaseMap.set(uc.getUcName(), uc);
    }
  }

  hasCommand(commandName: string): boolean {
    return this.useCaseMap.has(commandName);
  }

  async handle(command: ModuleCommand): Promise<unknown> {
    const uc = this.useCaseMap.get(command.name);

    if (!uc) {
      this.throwNoCommandFound(command.name);
    }

    return uc.handle(command.attrs, command.actorId);
  }

  protected throwNoCommandFound(commandName: string): never {
    throwError(
      errBadRequest<NoCommandFoundError>(
        'NO_COMMAND_FOUND',
        `Команда '${commandName}' не найдена в модуле '${this.name}'`,
        {
          commandName,
          moduleName: this.name,
        },
      ),
    );
  }

  /**
   * Возвращает метаданные команд модуля.
   * Агрегирует getCommand() каждого use-case.
   */
  getDocTypes(): UcDocType[] {
    return this.useCases.map((uc) => uc.getDocType());
  }
}
