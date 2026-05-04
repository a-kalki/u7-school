import { fromError } from "../../domain/errors/error-helpers";
import type { AppError } from "../../domain/errors/errors";
import type { ModuleCommand, ModuleMeta } from "../../domain/module/types";
import type { Module } from "../module/module";

export type CliResponse =
  | { success: true; data: unknown }
  | { success: false; error: AppError };

export function createCliController<TMeta extends ModuleMeta, TResolve>(
  module: Module<TMeta, TResolve>,
) {
  return {
    async run(args: string[]): Promise<CliResponse> {
      try {
        if (args.length === 0) {
          throw new Error("Не указано имя команды");
        }

        const commandName = args[0] as string;
        let attrs = {};

        // Простой парсинг: ожидаем, что второй аргумент - это JSON строка с параметрами
        if (args.length > 1 && args[1]) {
          try {
            attrs = JSON.parse(args[1]);
          } catch {
            throw new Error("Параметры должны быть валидным JSON");
          }
        }

        const command: ModuleCommand = {
          name: commandName,
          attrs,
        };

        const result = await module.handle(command);

        return {
          success: true,
          data: result,
        };
      } catch (error) {
        return {
          success: false,
          error: fromError(error),
        };
      }
    },
  };
}
