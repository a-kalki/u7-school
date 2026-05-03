import { throwError } from "../errors/error-helpers";
import type { DomainError } from "../errors/errors";

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
