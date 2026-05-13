import { describe, expect, test } from "bun:test";
import * as v from "valibot";
import type { ArMeta } from "#domain/ar/aggregate";
import { Aggregate } from "#domain/ar/aggregate";
import { errBadRequest } from "#domain/errors/error-helpers";
import type { BadRequestError } from "#domain/errors/errors";
import { AppException } from "#domain/errors/errors";
import { UseCase } from "./use-case";

type TestUcError = BadRequestError<"TestUcError">;

type TestNotIncludedUcError = BadRequestError<"TestNotfincludedUcError">;

interface TestArMeta extends ArMeta {
	name: "TestAr";
	label: "Тестовый агрегат";
	state: { uuid: string; createdAt: string; updatedAt?: string } & Record<
		string,
		unknown
	>;
}

class TestAr extends Aggregate<TestArMeta> {
	static readonly arName = "TestAr";
	static readonly arLabel = "Тестовый агрегат";
}

interface TestUcMeta {
	ucName: "test-cmd";
	arMeta: TestArMeta;
	input: { foo: string };
	output: { bar: string };
	errors: TestUcError;
	requiresAuth: false;
	type: "command";
}

class TestUseCase extends UseCase<TestUcMeta, { test: boolean }> {
	protected readonly ucName = "test-cmd" as const;
	protected readonly ucLabel = "Тестовый UC" as const;
	protected readonly arMeta = {
		arName: "TestAr" as const,
		arLabel: "Тестовый агрегат" as const,
	};
	protected readonly type = "command" as const;
	protected readonly requiresAuth = false as const;
	protected readonly inputSchema = v.object({ foo: v.string() });
	protected readonly outputSchema = v.object({ bar: v.string() });

	protected async getUser(_userId: string): Promise<Record<string, unknown>> {
		return {};
	}

	execute(command: { foo: string }) {
		if (command.foo === "bad") {
			this.throwError(
				errBadRequest<TestUcError>("TestUcError", "Bad input", undefined),
			);
		}
		if (command.foo === "bar") {
			this.throwError(
				// @ts-expect-error: линтер запрещает вызывать ошибки не включенные в Meta
				errBadRequest<TestNotIncludedUcError>(
					"TestNotfincludedUcError",
					"Bad input",
					undefined,
				),
			);
		}
		return { bar: `ok-${this.resolve.test}` };
	}
}

describe("UseCase", () => {
	test("use-case валидирует команду через схему", async () => {
		const uc = new TestUseCase();
		uc.init({ test: true });

		let caught: unknown;
		try {
			await uc.handle({ foo: 123 }); // invalid type
		} catch (e) {
			caught = e;
		}

		expect(caught).toBeInstanceOf(AppException);
		const appEx = caught as AppException;
		expect(appEx.error.kind).toBe("validation");
		expect(appEx.error.name).toBe("INPUT_VALIDATION_ERROR");
	});

	test("use-case имеет доступ к резолверу модуля и возвращает результат", async () => {
		const uc = new TestUseCase();
		uc.init({ test: true });

		const result = await uc.handle({ foo: "good" });
		expect(result.bar).toBe("ok-true");
	});

	test("use-case выбрасывает ошибку через throwError из бизнес-логики", async () => {
		const uc = new TestUseCase();
		uc.init({ test: true });

		let caught: unknown;
		try {
			await uc.handle({ foo: "bad" });
		} catch (e) {
			caught = e;
		}

		expect(caught).toBeInstanceOf(AppException);
		const appEx = caught as AppException;
		expect(appEx.error.name).toBe("TestUcError");
		expect(appEx.error.kind).toBe("bad-request");
	});

	test("getDocType возвращает arName/arLabel из arMeta", () => {
		const uc = new TestUseCase();
		const doc = uc.getDocType();
		expect(doc.arName).toBe("TestAr");
		expect(doc.arLabel).toBe("Тестовый агрегат");
		expect(doc.ucName).toBe("test-cmd");
		expect(doc.ucLabel).toBe("Тестовый UC");
	});
});
