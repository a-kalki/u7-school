import type { UseCase, UcMeta } from "./uc/use-case";
import { throwError } from "../domain/errors/error-helpers";
import type { NoCommandFoundError } from "../domain/errors/errors";

export interface ModuleCommand {
  name: string;
  attrs: unknown;
  actorId?: string;
}

export abstract class Module<TResolve> {
  abstract readonly name: string;
  // biome-ignore lint/suspicious/noExplicitAny: allow UseCase array with any types for generic storage
  abstract readonly useCases: UseCase<any, TResolve>[];

  protected resolve!: TResolve;
  
  // Кэш для быстрого поиска use-case по имени
  // biome-ignore lint/suspicious/noExplicitAny: allow useCase any
  private useCaseMap = new Map<string, UseCase<any, TResolve>>();

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
    } as NoCommandFoundError);
  }

  /**
   * Возвращает метаданные команд модуля.
   * Опциональный задел для генерации OpenAPI.
   */
  getCommands() {
    return this.useCases.map((uc) => {
      // Чтобы получить схему, которая объявлена как protected, делаем cast
      // biome-ignore lint/suspicious/noExplicitAny: access protected property
      const schema = (uc as any).inputSchema;
      return {
        commandName: uc.commandName,
        inputSchema: schema,
      };
    });
  }
}
