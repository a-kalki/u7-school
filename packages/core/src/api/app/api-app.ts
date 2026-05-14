import { App } from "./app";
import type { AppMeta, ApiModuleMeta } from "#domain/module/types";
import { throwError, errBadRequest } from "#domain/errors/error-helpers";
import type { NoCommandFoundError } from "#domain/errors/errors";

type ExtractUcMetas<TAppMeta extends AppMeta<any>> = 
	TAppMeta extends AppMeta<infer TModules>
		? TModules extends ApiModuleMeta<infer TUcMetas>
			? TUcMetas
			: never
		: never;

/**
 * Реализация приложения для backend-окружения
 */
export class ApiApp<TMeta extends AppMeta<any>> extends App {
	// Здесь можно добавить специфичную логику бэкенда:
	// - Глобальные middleware (логирование, метрики)
	// - Обработку глобальных ошибок
	// - Жизненный цикл (init, shutdown)

	async execute<
		TUcName extends ExtractUcMetas<TMeta>["ucName"],
		TTargetUcMeta extends Extract<ExtractUcMetas<TMeta>, { ucName: TUcName }>,
		TInput extends TTargetUcMeta["input"],
		TOutput extends TTargetUcMeta["output"]
	>(
		ucName: TUcName,
		attrs: TInput,
		actorId?: string,
	): Promise<TOutput> {
		const module = this.getModules().find((m) => m.hasCommand(ucName));
		if (!module) {
			return throwError(
				errBadRequest<NoCommandFoundError>(
					"NO_COMMAND_FOUND",
					`Команда '${ucName}' не найдена ни в одном зарегистрированном модуле`,
					{ commandName: ucName, moduleName: "ApiApp" },
				),
			);
		}

		return module.handle({
			name: ucName,
			attrs,
			actorId,
		}) as Promise<TOutput>;
	}
}
