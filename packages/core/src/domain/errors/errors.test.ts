import { describe, expect, test } from "bun:test";
import { fromError, throwError } from "./error-helpers";
import type { AppError } from "./errors";
import { AppException } from "./errors";

describe("errors", () => {
	test("throwError выбрасывает исключение с правильным объектом ошибки", () => {
		const domainErr: AppError = {
			name: "TestDomainError",
			level: "domain",
			kind: "validation",
			message: "Test msg",
		};
		let caught: unknown;
		try {
			throwError(domainErr);
		} catch (e) {
			caught = e;
		}
		expect(caught).toBeInstanceOf(AppException);
		const appEx = caught as AppException;
		expect(appEx.error).toEqual(domainErr);
	});

	test("fromError восстанавливает объект ошибки из исключения", () => {
		const apiErr: AppError = {
			name: "TestApiError",
			level: "api",
			kind: "bad-request",
			message: "Api msg",
			payload: { x: 1 },
		};
		const exception = new AppException(apiErr);
		const recovered = fromError(exception);
		expect(recovered).toEqual(apiErr);
	});

	test("fromError возвращает неизвестную ошибку для стандартного Error", () => {
		const error = new Error("Some standard error");
		const recovered = fromError(error);
		expect(recovered.level).toBe("api");
		expect(recovered.name).toBe("UnknownError");
		expect(recovered.message).toBe("Some standard error");
	});
});
