import { describe, expect, test } from "bun:test";
import * as v from "valibot";
import type { ApiError } from "../../domain/errors/errors";
import { AppException } from "../../domain/errors/errors";
import type { UcMeta } from "./use-case";
import { UseCase } from "./use-case";

interface OutputTestError extends ApiError {
	name: "OutputTestError";
	kind: "bad-request";
}

interface OutputTestUcMeta extends UcMeta {
	commandName: "test-output";
	input: { foo: string };
	output: { bar: string; count: number };
	errors: OutputTestError;
}

class ValidOutputUseCase extends UseCase<OutputTestUcMeta, { prefix: string }> {
	protected readonly commandName = "test-output";
	protected readonly description = "Тестовый UC с валидацией выхода";
	protected readonly aggregateName = "TestAr";
	protected readonly aggregateLabel = "Тестовый агрегат";
	protected readonly type = "command" as const;
	protected readonly requiresAuth = false as const;
	protected readonly inputSchema = v.object({ foo: v.string() });
	protected readonly outputSchema = v.object({
		bar: v.string(),
		count: v.number(),
	});

	execute(command: { foo: string }) {
		return {
			bar: `${this.resolve.prefix}-${command.foo}`,
			count: command.foo.length,
		};
	}
}

class InvalidOutputUseCase extends UseCase<
	OutputTestUcMeta,
	{ prefix: string }
> {
	protected readonly commandName = "test-output";
	protected readonly description = "Тестовый UC с невалидным выходом";
	protected readonly aggregateName = "TestAr";
	protected readonly aggregateLabel = "Тестовый агрегат";
	protected readonly type = "command" as const;
	protected readonly requiresAuth = false as const;
	protected readonly inputSchema = v.object({ foo: v.string() });
	protected readonly outputSchema = v.object({
		bar: v.string(),
		count: v.number(),
	});

	execute() {
		// Возвращаем невалидный output (count — строка вместо числа)
		return { bar: "bad", count: "not-a-number" } as unknown as {
			bar: string;
			count: number;
		};
	}
}

describe("UseCase: output validation", () => {
	test("валидирует корректный output через outputSchema", async () => {
		const uc = new ValidOutputUseCase();
		uc.init({ prefix: "ok" });

		const result = await uc.handle({ foo: "hello" });

		expect(result.bar).toBe("ok-hello");
		expect(result.count).toBe(5);
	});

	test("при невалидном output выбрасывает internal error", async () => {
		const uc = new InvalidOutputUseCase();
		uc.init({ prefix: "ok" });

		let caught: unknown;
		try {
			await uc.handle({ foo: "hello" });
			expect("this").toBe("not be call");
		} catch (e) {
			caught = e;
		}

		expect(caught).toBeInstanceOf(AppException);
		const appEx = caught as AppException;
		expect(appEx.error.kind).toBe("internal");
		expect(appEx.error.name).toBe("OUTPUT_VALIDATION_ERROR");
	});

	test("handle() вызывает цепочку validateInput → execute → validateOutput", async () => {
		const uc = new ValidOutputUseCase();
		uc.init({ prefix: "chain" });

		const result = await uc.handle({ foo: "link" });

		expect(result.bar).toBe("chain-link");
		expect(result.count).toBe(4);
	});
});
