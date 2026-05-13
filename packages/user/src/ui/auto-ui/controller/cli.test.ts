import { describe, expect, it, mock, spyOn } from "bun:test";
import * as readline from "node:readline/promises";
import type { AutoUiApp } from "@u7/core/ui";
import { AutoUiCliController } from "@u7/core/ui";
import { UserCliController } from "./cli";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyAutoUiApp = AutoUiApp<any>;

function mockApp(overrides: Partial<AnyAutoUiApp> = {}): AnyAutoUiApp {
	return {
		handleInput: mock(async (text: string) => {
			if (text === "/user/user/create-user") return "prompt: введите данные";
			if (text === "/app") return "Приветствие";
			return "ok";
		}),
		callUseCase: mock(async () => ({ users: [] })),
		currentActor: null,
		...overrides,
	} as unknown as AnyAutoUiApp;
}

describe("UserCliController", () => {
	it("расширяет AutoUiCliController", () => {
		const app = mockApp();
		const ctrl = new UserCliController(app);
		expect(ctrl).toBeInstanceOf(AutoUiCliController);
	});

	describe("handleRegister()", () => {
		it("вызывает app.handleInput с путём create-user и обрамляет заголовком", async () => {
			const app = mockApp();
			const ctrl = new UserCliController(app);
			const result = await ctrl.handleRegister();
			expect(result).toContain("**Регистрация первого администратора**");
			expect(result).toContain("prompt: введите данные");
			expect(app.handleInput).toHaveBeenCalledWith("/user/user/create-user");
		});
	});

	describe("handleLogin(args?)", () => {
		it("без аргументов: показывает список пользователей", async () => {
			const app = mockApp({
				callUseCase: mock(async () => ({
					users: [
						{ uuid: "u1", name: "Иван" },
						{ uuid: "u2", name: "Мария" },
					],
				})),
			});

			const ctrl = new UserCliController(app);
			const result = await ctrl.handleLogin();
			expect(result).toContain("**Выберите пользователя:**");
			expect(result).toContain("Иван");
			expect(result).toContain("/login u1");
			expect(result).toContain("Мария");
			expect(result).toContain("/login u2");
			expect(app.callUseCase).toHaveBeenCalledWith("user", "list-users", {});
		});

		it("без аргументов, пустой список: сообщение об отсутствии пользователей", async () => {
			const app = mockApp({
				callUseCase: mock(async () => ({ users: [] })),
			});
			const ctrl = new UserCliController(app);
			const result = await ctrl.handleLogin();
			expect(result).toContain("Нет зарегистрированных пользователей");
		});

		it("с простым значением: проверяет существование и устанавливает actor", async () => {
			const app = mockApp({
				callUseCase: mock(async () => ({
					users: [{ uuid: "user-123", name: "Иван" }],
				})),
			});

			const ctrl = new UserCliController(app);
			const result = await ctrl.handleLogin("user-123");
			expect(app.currentActor).toEqual({ uuid: "user-123", name: "Иван" });
			expect(result).toContain("**Вход выполнен.**");
			expect(result).toContain("Иван");
		});

		it("с простым значением: если пользователь не найден — ошибка", async () => {
			const app = mockApp({
				callUseCase: mock(async () => ({ users: [] })),
			});
			const ctrl = new UserCliController(app);
			const result = await ctrl.handleLogin("nonexistent");
			expect(result).toContain("не найден");
			expect(app.currentActor).toBeNull();
		});

		it('с префиксом "uuid: <id>": проверяет и устанавливает actor', async () => {
			const app = mockApp({
				callUseCase: mock(async () => ({
					users: [{ uuid: "user-456", name: "Мария" }],
				})),
			});
			const ctrl = new UserCliController(app);
			const result = await ctrl.handleLogin("uuid: user-456");
			expect(app.currentActor).toEqual({ uuid: "user-456", name: "Мария" });
			expect(result).toContain("**Вход выполнен.**");
			expect(result).toContain("Мария");
		});

		it('с префиксом "telegramId: <num>": ищет через фильтр list-users', async () => {
			const app = mockApp({
				callUseCase: mock(
					async (
						_mod: string,
						_cmd: string,
						attrs: Record<string, unknown>,
					) => {
						if (attrs.telegramId === 12345) {
							return {
								users: [{ uuid: "tg-user-1", name: "TG User" }],
							};
						}
						return { users: [] };
					},
				),
			});
			const ctrl = new UserCliController(app);
			const result = await ctrl.handleLogin("telegramId: 12345");
			expect(app.callUseCase).toHaveBeenCalledWith("user", "list-users", {
				telegramId: 12345,
				limit: 1,
			});
			expect(app.currentActor).toEqual({ uuid: "tg-user-1", name: "TG User" });
			expect(result).toContain("**Вход выполнен.**");
			expect(result).toContain("TG User");
		});

		it('с префиксом "telegramId:" если пользователь не найден — ошибка', async () => {
			const app = mockApp({
				callUseCase: mock(async () => ({ users: [] })),
			});
			const ctrl = new UserCliController(app);
			const result = await ctrl.handleLogin("telegramId: 99999");
			expect(result).toContain("не найден");
		});

		it('с префиксом "telegramId:" нечисловое значение — ошибка', async () => {
			const app = mockApp();
			const ctrl = new UserCliController(app);
			const result = await ctrl.handleLogin("telegramId: abc");
			expect(result).toContain("должен быть числом");
		});

		it('с префиксом "name: <часть>": ищет через фильтр name', async () => {
			const app = mockApp({
				callUseCase: mock(
					async (
						_mod: string,
						_cmd: string,
						attrs: Record<string, unknown>,
					) => {
						if (attrs.name === "Иван") {
							return {
								users: [{ uuid: "u1", name: "Иван Петров" }],
							};
						}
						return { users: [] };
					},
				),
			});
			const ctrl = new UserCliController(app);
			const result = await ctrl.handleLogin("name: Иван");
			expect(app.callUseCase).toHaveBeenCalledWith("user", "list-users", {
				name: "Иван",
			});
			expect(app.currentActor).toEqual({ uuid: "u1", name: "Иван Петров" });
			expect(result).toContain("**Вход выполнен.**");
			expect(result).toContain("Иван Петров");
		});

		it('с префиксом "name:" при нескольких совпадениях — показывает варианты', async () => {
			const app = mockApp({
				callUseCase: mock(async () => ({
					users: [
						{ uuid: "u1", name: "Иван Петров" },
						{ uuid: "u3", name: "Иван Сидоров" },
					],
				})),
			});
			const ctrl = new UserCliController(app);
			const result = await ctrl.handleLogin("name: Иван");
			expect(result).toContain("Найдено несколько пользователей");
			expect(result).toContain("Иван Петров");
			expect(result).toContain("Иван Сидоров");
			expect(app.currentActor).toBeNull();
		});

		it('с префиксом "name:" при отсутствии совпадений — сообщение', async () => {
			const app = mockApp({
				callUseCase: mock(async () => ({ users: [] })),
			});
			const ctrl = new UserCliController(app);
			const result = await ctrl.handleLogin("name: Неизвестный");
			expect(result).toContain("не найдены");
		});
	});

	describe("renderMenu()", () => {
		it("без пользователей: показывает /register", async () => {
			const app = mockApp({
				callUseCase: mock(async () => ({ users: [] })),
			});
			const ctrl = new UserCliController(app);
			const menu = await ctrl.renderMenu();
			expect(menu).toContain("/register");
			expect(menu).not.toContain("/login");
			expect(app.callUseCase).toHaveBeenCalledWith("user", "list-users", {
				limit: 1,
			});
		});

		it("с пользователями и без сессии: показывает /login", async () => {
			const app = mockApp({
				callUseCase: mock(async () => ({
					users: [{ uuid: "u1", name: "Иван" }],
				})),
			});
			const ctrl = new UserCliController(app);
			const menu = await ctrl.renderMenu();
			expect(menu).toContain("/login");
			expect(menu).not.toContain("/register");
		});

		it("с активной сессией: показывает имя и uuid", async () => {
			const app = mockApp({
				currentActor: { uuid: "u1", name: "Иван" },
			});
			const ctrl = new UserCliController(app);
			const menu = await ctrl.renderMenu();
			expect(menu).toContain("Активный пользователь");
			expect(menu).toContain("Иван");
			expect(menu).toContain("u1");
		});

		it("если callUseCase падает — fallback-меню с /register", async () => {
			const app = mockApp({
				callUseCase: mock(async () => {
					throw new Error("DB error");
				}),
			});
			const ctrl = new UserCliController(app);
			const menu = await ctrl.renderMenu();
			expect(menu).toContain("/register");
		});
	});

	describe("onCommandExecuted (авто-авторизация)", () => {
		it("не устанавливает сессию если уже залогинены", () => {
			const app = mockApp({
				currentActor: { uuid: "existing", name: "Existing" },
			});
			const ctrl = new UserCliController(app);
			ctrl.onCommandExecuted(
				'**Успех!**\n\n```json\n{"uuid":"new","name":"New"}\n```',
			);
			expect(app.currentActor).toEqual({ uuid: "existing", name: "Existing" });
		});

		it("устанавливает сессию после успешной регистрации", () => {
			const app = mockApp({ currentActor: null });
			const ctrl = new UserCliController(app);
			ctrl.onCommandExecuted(
				'**Успех!**\n\n```json\n{"uuid":"abc-123","name":"Иван"}\n```',
			);
			expect(app.currentActor).toEqual({ uuid: "abc-123", name: "Иван" });
		});

		it("игнорирует ответ без JSON с uuid и name", () => {
			const app = mockApp({ currentActor: null });
			const ctrl = new UserCliController(app);
			ctrl.onCommandExecuted("Какой-то обычный ответ");
			expect(app.currentActor).toBeNull();
		});
	});

	describe("CLI-окружение", () => {
		it("createReadline() возвращает readline.Interface", () => {
			const app = mockApp();
			const ctrl = new UserCliController(app);
			const rl = ctrl.createReadline();
			expect(rl).toBeDefined();
			expect(typeof rl.close).toBe("function");
		});

		it("writePrompt() выводит > ", () => {
			const writeSpy = spyOn(process.stdout, "write").mockImplementation(
				() => true,
			);
			const app = mockApp();
			const ctrl = new UserCliController(app);
			ctrl.writePrompt();
			expect(writeSpy).toHaveBeenCalledWith("\n> ");
			writeSpy.mockRestore();
		});

		it("handleQuit() выводит До свидания!", () => {
			const logSpy = spyOn(console, "log").mockImplementation(() => {});
			const app = mockApp();
			const ctrl = new UserCliController(app);
			ctrl.handleQuit();
			expect(logSpy).toHaveBeenCalledWith("До свидания!");
			logSpy.mockRestore();
		});
	});

	describe("REPL-цикл через AutoUiCliController.run()", () => {
		it("полный сценарий: about → меню → /register", async () => {
			const app = mockApp({
				callUseCase: mock(async () => ({ users: [] })),
			});

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

			const ctrl = new UserCliController(app);
			await ctrl.run();

			expect(logSpy).toHaveBeenCalledWith("\nПриветствие");
			const menuCalls = logSpy.mock.calls
				.map((c) => c[0])
				.filter((s) => typeof s === "string" && s.includes("/register"));
			expect(menuCalls.length).toBeGreaterThan(0);

			const registerCalls = logSpy.mock.calls
				.map((c) => c[0])
				.filter(
					(s) =>
						typeof s === "string" &&
						s.includes("Регистрация первого администратора"),
				);
			expect(registerCalls.length).toBeGreaterThan(0);

			writeSpy.mockRestore();
			logSpy.mockRestore();
		});
	});
});
