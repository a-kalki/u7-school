import { throwError } from "../../domain/errors/error-helpers";
import type { NoCommandFoundError } from "../../domain/errors/errors";
import type { ModuleCommand, ModuleMeta } from "../../domain/module/types";
import type { UcMeta, UseCase } from "../uc/use-case";

export abstract class Module<TMeta extends ModuleMeta, TResolve> {
  abstract readonly name: TMeta["name"];
  abstract readonly useCases: UseCase<UcMeta, TResolve>[];

  protected resolve!: TResolve;

  // Кэш для быстрого поиска use-case по имени
  private useCaseMap = new Map<string, UseCase<UcMeta, TResolve>>();

  init(resolve: TResolve) {
    this.resolve = resolve;
    for (const uc of this.useCases) {
      uc.init(resolve);
      this.useCaseMap.set(uc.commandName, uc);
    }
  }

  async handle(command: ModuleCommand): Promise<unknown> {
    const uc = this.useCaseMap.get(command.name);

    if (!uc) {
      this.throwNoCommandFound(command.name);
    }

    return uc.handle(command.attrs, command.actorId);
  }

  protected throwNoCommandFound(commandName: string): never {
    throwError({
      name: "NO_COMMAND_FOUND",
      level: "api",
      kind: "bad-request",
      message: `Команда '${commandName}' не найдена в модуле '${this.name}'`,
      payload: { commandName, moduleName: this.name },
    } satisfies NoCommandFoundError);
  }

  /**
   * Возвращает метаданные команд модуля.
   * Опциональный задел для генерации OpenAPI.
   */
  getCommands() {
    return this.useCases.map((uc) => {
      const schema = uc.getInputSchema();
      return {
        commandName: uc.commandName,
        inputSchema: schema,
      };
    });
  }
}
