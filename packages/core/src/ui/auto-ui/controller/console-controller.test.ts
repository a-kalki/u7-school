import { describe, expect, it, mock, spyOn } from "bun:test";
import * as readline from "node:readline/promises";
import * as v from "valibot";
import { AppException, type AppError } from "#domain/errors/errors";
import type { AutoUiApp } from "../app/auto-ui-app";
import { AutoUiConsoleController } from "./console-controller";

describe("AutoUiConsoleController", () => {
	it("должен запускать цикл, выводить приветствие и обрабатывать ввод до /quit", async () => {
		// Mock AutoUiApp
		const mockApp = {
			handleInput: mock(async (text: string) => {
				if (text === "/app") return "Приветствие";
				if (text === "/modules") return "Список модулей";
				return `Ответ на ${text}`;
			}),
		} as unknown as AutoUiApp;

		// Mock readline async iterator
		const mockLines = ["/modules", "/quit"];
		const mockRl = {
			[Symbol.asyncIterator]: async function* () {
				for (const line of mockLines) yield line;
			},
			close: mock(),
		};

		spyOn(readline, "createInterface").mockReturnValue(mockRl as any);

		// Перехватываем console.log и process.stdout.write
		const logSpy = spyOn(console, "log").mockImplementation(() => {});
		const writeSpy = spyOn(process.stdout, "write").mockImplementation(
			() => true,
		);

		const controller = new AutoUiConsoleController(mockApp);
		await controller.run();

		// Проверяем вызовы
		expect(mockApp.handleInput).toHaveBeenCalledWith("/app");
		expect(mockApp.handleInput).toHaveBeenCalledWith("/modules");

		expect(logSpy).toHaveBeenCalledWith("\nПриветствие");
		expect(logSpy).toHaveBeenCalledWith("\nСписок модулей");
		expect(logSpy).toHaveBeenCalledWith("До свидания!");

		expect(mockRl.close).toHaveBeenCalled();

		logSpy.mockRestore();
		writeSpy.mockRestore();
	});

	it("должен поддерживать многострочный ввод для UseCase", async () => {
		const mockApp = {
			handleInput: mock(async (text: string) => `Executed: ${text}`),
		} as unknown as AutoUiApp;

		const mockLines = ["/courses/course/add", "- JS Basics", ""]; // Пустая строка для завершения
		const mockRl = {
			[Symbol.asyncIterator]: async function* () {
				for (const line of mockLines) yield line;
			},
			close: mock(),
		};

		spyOn(readline, "createInterface").mockReturnValue(mockRl as any);
		const logSpy = spyOn(console, "log").mockImplementation(() => {});
		const writeSpy = spyOn(process.stdout, "write").mockImplementation(
			() => true,
		);

		const controller = new AutoUiConsoleController(mockApp);
		await controller.run();

		expect(mockApp.handleInput).toHaveBeenCalledWith(
			"/courses/course/add\n- JS Basics",
		);
		expect(logSpy).toHaveBeenCalledWith(
			"\nExecuted: /courses/course/add\n- JS Basics",
		);

		logSpy.mockRestore();
		writeSpy.mockRestore();
	});

	it("должен форматировать ошибки валидации через formatValibotErrors", async () => {
		// Создаём реальную ошибку валидации Valibot
		const schema = v.object({ title: v.string(), age: v.number() });
		const result = v.safeParse(schema, { title: 123, age: "не число" });
		if (result.success) throw new Error("Ожидалась ошибка");

		const validationError: AppError = {
			name: "INPUT_VALIDATION_ERROR",
			level: "domain",
			kind: "validation",
			message: "Переданы некорректные данные",
			payload: { issues: [], rawIssues: result.issues },
		};

		const mockApp = {
			handleInput: mock(async (text: string) => {
				if (text === "/app") return "Приветствие";
				if (text === "/bad") throw new AppException(validationError);
				return "OK";
			}),
		} as unknown as AutoUiApp;

		const mockLines = ["/bad", "/quit"];
		const mockRl = {
			[Symbol.asyncIterator]: async function* () {
				for (const line of mockLines) yield line;
			},
			close: mock(),
		};

		spyOn(readline, "createInterface").mockReturnValue(mockRl as any);
		const logSpy = spyOn(console, "log").mockImplementation(() => {});
		const writeSpy = spyOn(process.stdout, "write").mockImplementation(
			() => true,
		);

		const controller = new AutoUiConsoleController(mockApp);
		await controller.run();

		// Проверяем, что ошибка валидации была отформатирована
		const validationOutput = logSpy.mock.calls
			.map((c) => c[0])
			.join(" ");
		expect(validationOutput).toContain("Ошибки валидации:");
		expect(validationOutput).toContain('"title"');
		expect(validationOutput).toContain('"age"');

		logSpy.mockRestore();
		writeSpy.mockRestore();
	});
});
