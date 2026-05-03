import { describe, expect, test } from "bun:test";
import type { ApiError, DomainError } from "./errors";
import { AppException } from "./errors";
import { fromError, throwError } from "./error-helpers";

describe("errors", () => {
	test("throwError выбрасывает исключение с правильным объектом ошибки", () => {
		const domainErr: DomainError = {
			name: "TestDomainError",
			level: "domain",
			kind: "validation",
			userMessage: "Test msg",
			debugInfo: "Test debug",
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
		const apiErr: ApiError = {
			name: "TestApiError",
			level: "api",
			kind: "bad-request",
			userMessage: "Api msg",
			debugInfo: "Api debug",
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
		expect(recovered.debugInfo).toBe("Some standard error");
	});
});
