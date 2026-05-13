import { describe, expect, it, mock } from "bun:test";
import * as v from "valibot";
import { type AppError, AppException } from "#domain/errors/errors";
import type { AutoUiApp } from "../app/auto-ui-app";
import { AutoUiController } from "./base";

/**
 * Конкретная реализация AutoUiController для тестов.
 */
class TestAutoUiController extends AutoUiController {}

describe("AutoUiController", () => {
	it("safeHandle делегирует в app.handleInput и возвращает строку", async () => {
		const mockApp = {
			handleInput: mock(async (text: string) => `Ответ на ${text}`),
		} as unknown as AutoUiApp;

		const controller = new TestAutoUiController(mockApp);
		const result = await controller.safeHandle("/app");
		expect(result).toBe("Ответ на /app");
		expect(mockApp.handleInput).toHaveBeenCalledWith("/app");
	});

	it("safeHandle форматирует AppException", async () => {
		const domainError: AppError = {
			name: "NOT_FOUND_ERROR",
			level: "domain",
			kind: "not-found",
			message: "Пользователь не найден",
		};

		const mockApp = {
			handleInput: mock(async () => {
				throw new AppException(domainError);
			}),
		} as unknown as AutoUiApp;

		const controller = new TestAutoUiController(mockApp);
		const result = await controller.safeHandle("/bad");
		expect(result).toContain("**Ошибка:**");
		expect(result).toContain("Пользователь не найден");
	});

	it("safeHandle форматирует ошибки валидации Valibot", async () => {
		const schema = v.object({ title: v.string(), age: v.number() });
		const parseResult = v.safeParse(schema, { title: 123, age: "не число" });
		if (parseResult.success) throw new Error("Ожидалась ошибка");

		const validationError: AppError = {
			name: "INPUT_VALIDATION_ERROR",
			level: "domain",
			kind: "validation",
			message: "Переданы некорректные данные",
			payload: { issues: [], rawIssues: parseResult.issues },
		};

		const mockApp = {
			handleInput: mock(async () => {
				throw new AppException(validationError);
			}),
		} as unknown as AutoUiApp;

		const controller = new TestAutoUiController(mockApp);
		const result = await controller.safeHandle("/bad");
		expect(result).toContain("Ошибки валидации:");
		expect(result).toContain('"title"');
		expect(result).toContain('"age"');
	});

	it("safeHandle форматирует обычные ошибки (не AppException)", async () => {
		const mockApp = {
			handleInput: mock(async () => {
				throw new Error("Сетевая ошибка");
			}),
		} as unknown as AutoUiApp;

		const controller = new TestAutoUiController(mockApp);
		const result = await controller.safeHandle("/bad");
		expect(result).toContain("**Ошибка выполнения:**");
		expect(result).toContain("Сетевая ошибка");
	});

	it("safeHandle форматирует не-Error исключения", async () => {
		const mockApp = {
			handleInput: mock(async () => {
				throw "строковая ошибка";
			}),
		} as unknown as AutoUiApp;

		const controller = new TestAutoUiController(mockApp);
		const result = await controller.safeHandle("/bad");
		expect(result).toContain("**Ошибка выполнения:**");
		expect(result).toContain("строковая ошибка");
	});

	it("конструктор принимает AutoUiApp", () => {
		const mockApp = {} as unknown as AutoUiApp;
		const controller = new TestAutoUiController(mockApp);
		expect(controller).toBeTruthy();
	});
});
