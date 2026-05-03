import { throwError } from "../domain/error-helpers";
import type { AppError } from "../domain/errors";

export interface UcMeta {
	commandName: string;
	input: unknown;
	output: unknown;
	errors: AppError;
}

export abstract class UseCase<TMeta extends UcMeta, TResolve = unknown> {
	abstract execute(
		command: TMeta["input"],
		actorId?: string,
	): Promise<TMeta["output"]> | TMeta["output"];

	/**
	 * Выбрасывает ошибку из пула возможных ошибок (TMeta['errors']).
	 */
	protected throwError(error: TMeta["errors"]): never {
		throwError(error);
	}
}
