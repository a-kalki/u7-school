import { throwError } from "./error-helpers";
import type { DomainError } from "./errors";

export interface ArMeta {
	name: string;
	errors: DomainError;
}

export abstract class Aggregate<TMeta extends ArMeta> {
	/**
	 * Выбрасывает доменную ошибку из пула возможных ошибок (TMeta['errors']).
	 */
	protected throwError(error: TMeta["errors"]): never {
		throwError(error);
	}
}
