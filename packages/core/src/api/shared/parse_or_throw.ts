import * as v from "valibot";
import { DomainException } from "../../domain/shared/exceptions";

/**
 * Валидирует значение через Valibot-схему.
 * При ошибке выбрасывает DomainException.validation с плоскими issues.
 * При успехе возвращает типизированный output.
 */
export function parseOrThrow<TSchema extends v.GenericSchema>(
	schema: TSchema,
	value: unknown,
	userMessage = "Неверные данные",
	debugInfo = "Ошибка валидации",
): v.InferOutput<TSchema> {
	const result = v.safeParse(schema, value);
	if (!result.success) {
		throw DomainException.validation(
			userMessage,
			debugInfo,
			v.flatten<TSchema>(result.issues),
		);
	}
	return result.output;
}
