import { errBadRequest, throwError } from "../../domain/errors/error-helpers";
import type { ModuleCommand, ModuleMeta } from "../../domain/module/types";
import type { UcDocType, UcMeta, UseCase } from "../uc/use-case";

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
			this.useCaseMap.set(uc.getCommandName(), uc);
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
		throwError(
			errBadRequest("NO_COMMAND_FOUND", `Команда '${commandName}' не найдена в модуле '${this.name}'`, {
				commandName,
				moduleName: this.name,
			}),
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
