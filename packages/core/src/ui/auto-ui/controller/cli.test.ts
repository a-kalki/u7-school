import { describe, expect, it, mock, spyOn } from "bun:test";
import * as readline from "node:readline/promises";
import type { AutoUiApp } from "../app/auto-ui-app";
import { AutoUiController } from "./base";
import { AutoUiCliController } from "./cli";

/**
 * Конкретная реализация AutoUiCliController для тестов.
 */
class TestCliController extends AutoUiCliController {
	createReadline(): readline.Interface {
		return readline.createInterface({
			input: process.stdin,
			output: process.stdout,
		});
	}
	writePrompt(): void {
		process.stdout.write("\n> ");
	}
	handleQuit(): void {
		console.log("До свидания!");
	}
	async handleRegister(): Promise<string> {
		return "register-handled";
	}
	async handleLogin(args?: string): Promise<string> {
		return `login-${args ?? "list"}`;
	}
	async renderMenu(): Promise<string> {
		return "меню";
	}
}

describe("AutoUiCliController", () => {
	it("расширяет AutoUiController", () => {
		const mockApp = {} as AutoUiApp;
		const ctrl = new TestCliController(mockApp);
		expect(ctrl).toBeInstanceOf(AutoUiController);
	});

	it("run() запускает REPL-цикл с построчным вводом", async () => {
		const mockApp = {
			handleInput: mock(async (text: string) => {
				if (text === "/app") return "Приветствие";
				if (text === "/modules") return "Список модулей";
				return `Ответ на ${text}`;
			}),
		} as unknown as AutoUiApp;

		const mockLines = ["/modules", "/quit"];
		const mockRl = {
			[Symbol.asyncIterator]: async function* () {
				for (const line of mockLines) yield line;
			},
			close: mock(() => {}),
		};

		spyOn(readline, "createInterface").mockReturnValue(mockRl as any);
		const logSpy = spyOn(console, "log").mockImplementation(() => {});
		const writeSpy = spyOn(process.stdout, "write").mockImplementation(
			() => true,
		);

		const ctrl = new TestCliController(mockApp);
		await ctrl.run();

		expect(mockApp.handleInput).toHaveBeenCalledWith("/app");
		expect(mockApp.handleInput).toHaveBeenCalledWith("/modules");
		expect(logSpy).toHaveBeenCalledWith("\nПриветствие");
		expect(logSpy).toHaveBeenCalledWith("меню");
		expect(logSpy).toHaveBeenCalledWith("\nСписок модулей");
		expect(logSpy).toHaveBeenCalledWith("До свидания!");

		writeSpy.mockRestore();
		logSpy.mockRestore();
	});

	it("буферизация: /module/agg/uc + параметры + пустая строка → выполнение", async () => {
		const mockApp = {
			handleInput: mock(async (text: string) => {
				if (text === "/app") return "Приветствие";
				return `Executed: ${text}`;
			}),
		} as unknown as AutoUiApp;

		const mockLines = ["/courses/course/add", "- JS Basics", ""];
		const mockRl = {
			[Symbol.asyncIterator]: async function* () {
				for (const line of mockLines) yield line;
			},
			close: mock(() => {}),
		};

		spyOn(readline, "createInterface").mockReturnValue(mockRl as any);
		const logSpy = spyOn(console, "log").mockImplementation(() => {});
		const writeSpy = spyOn(process.stdout, "write").mockImplementation(
			() => true,
		);

		const ctrl = new TestCliController(mockApp);
		await ctrl.run();

		expect(mockApp.handleInput).toHaveBeenCalledWith(
			"/courses/course/add\n- JS Basics",
		);
		expect(logSpy).toHaveBeenCalledWith(
			"\nExecuted: /courses/course/add\n- JS Basics",
		);

		writeSpy.mockRestore();
		logSpy.mockRestore();
	});

	it("навигационные команды выполняются мгновенно (без буферизации)", async () => {
		const mockApp = {
			handleInput: mock(async (text: string) => {
				if (text === "/app") return "Приветствие";
				return `Nav: ${text}`;
			}),
		} as unknown as AutoUiApp;

		// /modules — 2 части, не 3 → выполняется мгновенно
		const mockLines = ["/modules", "/quit"];
		const mockRl = {
			[Symbol.asyncIterator]: async function* () {
				for (const line of mockLines) yield line;
			},
			close: mock(() => {}),
		};

		spyOn(readline, "createInterface").mockReturnValue(mockRl as any);
		const logSpy = spyOn(console, "log").mockImplementation(() => {});
		const writeSpy = spyOn(process.stdout, "write").mockImplementation(
			() => true,
		);

		const ctrl = new TestCliController(mockApp);
		await ctrl.run();

		// /modules должно быть обработано мгновенно как отдельный вызов
		expect(mockApp.handleInput).toHaveBeenCalledWith("/modules");

		writeSpy.mockRestore();
		logSpy.mockRestore();
	});

	it("/quit завершает цикл", async () => {
		const mockApp = {
			handleInput: mock(async (text: string) => {
				if (text === "/app") return "Приветствие";
				return "ok";
			}),
		} as unknown as AutoUiApp;

		const mockLines = ["/quit"];
		const mockRl = {
			[Symbol.asyncIterator]: async function* () {
				for (const line of mockLines) yield line;
			},
			close: mock(() => {}),
		};

		spyOn(readline, "createInterface").mockReturnValue(mockRl as any);
		const logSpy = spyOn(console, "log").mockImplementation(() => {});
		const writeSpy = spyOn(process.stdout, "write").mockImplementation(
			() => true,
		);

		const ctrl = new TestCliController(mockApp);
		await ctrl.run();

		expect(logSpy).toHaveBeenCalledWith("До свидания!");
		expect(mockRl.close).toHaveBeenCalled();

		writeSpy.mockRestore();
		logSpy.mockRestore();
	});

	it("/exit завершает цикл", async () => {
		const mockApp = {
			handleInput: mock(async (text: string) => {
				if (text === "/app") return "Приветствие";
				return "ok";
			}),
		} as unknown as AutoUiApp;

		const mockLines = ["/exit"];
		const mockRl = {
			[Symbol.asyncIterator]: async function* () {
				for (const line of mockLines) yield line;
			},
			close: mock(() => {}),
		};

		spyOn(readline, "createInterface").mockReturnValue(mockRl as any);
		const logSpy = spyOn(console, "log").mockImplementation(() => {});
		const writeSpy = spyOn(process.stdout, "write").mockImplementation(
			() => true,
		);

		const ctrl = new TestCliController(mockApp);
		await ctrl.run();

		expect(logSpy).toHaveBeenCalledWith("До свидания!");

		writeSpy.mockRestore();
		logSpy.mockRestore();
	});

	it("setActor(id) устанавливает actor в app", () => {
		const mockApp = { currentActor: null } as AutoUiApp;
		const ctrl = new TestCliController(mockApp);
		ctrl.setActor("user-123", "Иван");
		expect(mockApp.currentActor).toEqual({ uuid: "user-123", name: "Иван" });
	});

	it("clearActor() сбрасывает actor в app", () => {
		const mockApp = {
			currentActor: { uuid: "user-123", name: "Иван" },
		} as AutoUiApp;
		const ctrl = new TestCliController(mockApp);
		ctrl.clearActor();
		expect(mockApp.currentActor).toBeNull();
	});

	it("get actorId читает uuid из app", () => {
		const mockApp = {
			currentActor: { uuid: "user-456", name: "Мария" },
		} as AutoUiApp;
		const ctrl = new TestCliController(mockApp);
		expect(ctrl.actorId).toBe("user-456");
		expect(ctrl.currentActor?.name).toBe("Мария");
	});

	it("конкретный подкласс реализует все абстрактные методы", () => {
		const mockApp = {} as AutoUiApp;
		const ctrl = new TestCliController(mockApp);
		// Все абстрактные методы должны быть реализованы в TestCliController
		expect(() => ctrl.handleRegister()).not.toThrow();
		expect(() => ctrl.handleLogin()).not.toThrow();
		expect(async () => await ctrl.renderMenu()).not.toThrow();
		expect(() => ctrl.createReadline()).not.toThrow();
		expect(() => ctrl.writePrompt()).not.toThrow();
		expect(() => ctrl.handleQuit()).not.toThrow();
	});

	it("при старте выводит /app (about) и меню", async () => {
		const mockApp = {
			handleInput: mock(async (text: string) => {
				if (text === "/app") return "Приветствие";
				return "ok";
			}),
		} as unknown as AutoUiApp;

		const mockLines = ["/quit"];
		const mockRl = {
			[Symbol.asyncIterator]: async function* () {
				for (const line of mockLines) yield line;
			},
			close: mock(() => {}),
		};

		spyOn(readline, "createInterface").mockReturnValue(mockRl as any);
		const logSpy = spyOn(console, "log").mockImplementation(() => {});
		const writeSpy = spyOn(process.stdout, "write").mockImplementation(
			() => true,
		);

		const ctrl = new TestCliController(mockApp);
		await ctrl.run();

		// При старте должен быть вызов /app и рендер меню
		expect(mockApp.handleInput).toHaveBeenCalledWith("/app");
		expect(logSpy).toHaveBeenCalledWith("меню");

		writeSpy.mockRestore();
		logSpy.mockRestore();
	});

	it('маршрутизирует "register" → handleRegister()', async () => {
		const mockApp = {
			handleInput: mock(async (text: string) => {
				if (text === "/app") return "Приветствие";
				return "ok";
			}),
		} as unknown as AutoUiApp;

		const mockLines = ["/register", "/quit"];
		const mockRl = {
			[Symbol.asyncIterator]: async function* () {
				for (const line of mockLines) yield line;
			},
			close: mock(() => {}),
		};

		spyOn(readline, "createInterface").mockReturnValue(mockRl as any);
		const logSpy = spyOn(console, "log").mockImplementation(() => {});
		const writeSpy = spyOn(process.stdout, "write").mockImplementation(
			() => true,
		);

		const ctrl = new TestCliController(mockApp);
		await ctrl.run();

		expect(logSpy).toHaveBeenCalledWith("\nregister-handled");

		writeSpy.mockRestore();
		logSpy.mockRestore();
	});

	it('маршрутизирует "login" (без аргументов) → handleLogin(undefined)', async () => {
		const mockApp = {
			handleInput: mock(async (text: string) => {
				if (text === "/app") return "Приветствие";
				return "ok";
			}),
		} as unknown as AutoUiApp;

		const mockLines = ["/login", "/quit"];
		const mockRl = {
			[Symbol.asyncIterator]: async function* () {
				for (const line of mockLines) yield line;
			},
			close: mock(() => {}),
		};

		spyOn(readline, "createInterface").mockReturnValue(mockRl as any);
		const logSpy = spyOn(console, "log").mockImplementation(() => {});
		const writeSpy = spyOn(process.stdout, "write").mockImplementation(
			() => true,
		);

		const ctrl = new TestCliController(mockApp);
		await ctrl.run();

		expect(logSpy).toHaveBeenCalledWith("\nlogin-list");

		writeSpy.mockRestore();
		logSpy.mockRestore();
	});

	it('маршрутизирует "login <args>" → handleLogin(args)', async () => {
		const mockApp = {
			handleInput: mock(async (text: string) => {
				if (text === "/app") return "Приветствие";
				return "ok";
			}),
		} as unknown as AutoUiApp;

		const mockLines = ["/login user-123", "/quit"];
		const mockRl = {
			[Symbol.asyncIterator]: async function* () {
				for (const line of mockLines) yield line;
			},
			close: mock(() => {}),
		};

		spyOn(readline, "createInterface").mockReturnValue(mockRl as any);
		const logSpy = spyOn(console, "log").mockImplementation(() => {});
		const writeSpy = spyOn(process.stdout, "write").mockImplementation(
			() => true,
		);

		const ctrl = new TestCliController(mockApp);
		await ctrl.run();

		expect(logSpy).toHaveBeenCalledWith("\nlogin-user-123");

		writeSpy.mockRestore();
		logSpy.mockRestore();
	});
});
