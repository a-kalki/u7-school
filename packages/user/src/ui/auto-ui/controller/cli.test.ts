import { describe, expect, it, mock, spyOn } from "bun:test";
import * as readline from "node:readline/promises";
import type { AutoUiApp } from "@u7/core/ui";
import { AutoUiCliController } from "@u7/core/ui";
import { UserCliController } from "./cli";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyAutoUiApp = AutoUiApp<any>;

describe("UserCliController", () => {
  it("расширяет AutoUiCliController", () => {
    const mockApp = {} as AnyAutoUiApp;
    const ctrl = new UserCliController(mockApp);
    expect(ctrl).toBeInstanceOf(AutoUiCliController);
  });

  describe("handleRegister()", () => {
    it("вызывает app.handleInput с путём create-user и обрамляет заголовком", async () => {
      const mockApp = {
        handleInput: mock(async (text: string) => {
          if (text === "/user/user/create-user") return "prompt: введите данные";
          return "ok";
        }),
      } as unknown as AnyAutoUiApp;

      const ctrl = new UserCliController(mockApp);
      const result = await ctrl.handleRegister();
      expect(result).toContain("**Регистрация первого администратора**");
      expect(result).toContain("prompt: введите данные");
      expect(mockApp.handleInput).toHaveBeenCalledWith("/user/user/create-user");
    });
  });

  describe("handleLogin(args?)", () => {
    it("без аргументов: показывает список пользователей", async () => {
      const mockApp = {
        handleInput: mock(async (text: string) => {
          if (text === "/user/user/list-users") {
            return JSON.stringify({
              users: [
                { uuid: "u1", name: "Иван" },
                { uuid: "u2", name: "Мария" },
              ],
            });
          }
          return "ok";
        }),
        currentActorId: null,
      } as unknown as AnyAutoUiApp;

      const ctrl = new UserCliController(mockApp);
      const result = await ctrl.handleLogin();
      expect(result).toContain("**Выберите пользователя:**");
      expect(result).toContain("Иван");
      expect(result).toContain("/login u1");
      expect(result).toContain("Мария");
      expect(result).toContain("/login u2");
    });

    it("без аргументов, пустой список: сообщение об отсутствии пользователей", async () => {
      const mockApp = {
        handleInput: mock(async () => JSON.stringify({ users: [] })),
        currentActorId: null,
      } as unknown as AnyAutoUiApp;

      const ctrl = new UserCliController(mockApp);
      const result = await ctrl.handleLogin();
      expect(result).toContain("Нет зарегистрированных пользователей");
    });

    it("с простым значением (без префикса): устанавливает actorId", async () => {
      const mockApp = {
        handleInput: mock(async () => "ok"),
        currentActorId: null,
      } as unknown as AnyAutoUiApp;

      const ctrl = new UserCliController(mockApp);
      const result = await ctrl.handleLogin("user-123");
      expect(mockApp.currentActorId).toBe("user-123");
      expect(result).toContain("**Вход выполнен.**");
    });

    it('с префиксом "uuid: <id>": устанавливает actorId', async () => {
      const mockApp = {
        handleInput: mock(async () => "ok"),
        currentActorId: null,
      } as unknown as AnyAutoUiApp;

      const ctrl = new UserCliController(mockApp);
      const result = await ctrl.handleLogin("uuid: user-456");
      expect(mockApp.currentActorId).toBe("user-456");
      expect(result).toContain("**Вход выполнен.**");
    });

    it('с префиксом "telegramId: <num>": ищет по telegramId и устанавливает actorId', async () => {
      const mockApp = {
        handleInput: mock(async (text: string) => {
          if (text === "/user/user/get-user-by-telegram-id") {
            return JSON.stringify({ uuid: "tg-user-1", name: "TG User" });
          }
          return "ok";
        }),
        currentActorId: null,
      } as unknown as AnyAutoUiApp;

      const ctrl = new UserCliController(mockApp);
      const result = await ctrl.handleLogin("telegramId: 12345");
      // Должен был вызвать get-user-by-telegram-id
      expect(mockApp.handleInput).toHaveBeenCalledWith(
        "/user/user/get-user-by-telegram-id",
      );
      expect(mockApp.currentActorId).toBe("tg-user-1");
      expect(result).toContain("**Вход выполнен.**");
    });

    it('с префиксом "telegramId:" если пользователь не найден — ошибка', async () => {
      const mockApp = {
        handleInput: mock(async () => {
          throw new Error("Not found");
        }),
        currentActorId: null,
      } as unknown as AnyAutoUiApp;

      const ctrl = new UserCliController(mockApp);
      const result = await ctrl.handleLogin("telegramId: 99999");
      expect(result).toContain("не найден");
    });

    it('с префиксом "name: <часть>": ищет по имени, при одном результате — логинится', async () => {
      const mockApp = {
        handleInput: mock(async (text: string) => {
          if (text === "/user/user/list-users") {
            return JSON.stringify({
              users: [
                { uuid: "u1", name: "Иван Петров" },
                { uuid: "u2", name: "Мария" },
              ],
            });
          }
          return "ok";
        }),
        currentActorId: null,
      } as unknown as AnyAutoUiApp;

      const ctrl = new UserCliController(mockApp);
      const result = await ctrl.handleLogin("name: Иван");
      expect(mockApp.currentActorId).toBe("u1");
      expect(result).toContain("**Вход выполнен.**");
    });

    it('с префиксом "name:" при нескольких совпадениях — показывает варианты', async () => {
      const mockApp = {
        handleInput: mock(async () =>
          JSON.stringify({
            users: [
              { uuid: "u1", name: "Иван Петров" },
              { uuid: "u3", name: "Иван Сидоров" },
            ],
          }),
        ),
        currentActorId: null,
      } as unknown as AnyAutoUiApp;

      const ctrl = new UserCliController(mockApp);
      const result = await ctrl.handleLogin("name: Иван");
      expect(result).toContain("Найдено несколько пользователей");
      expect(result).toContain("Иван Петров");
      expect(result).toContain("Иван Сидоров");
      // actorId не должен быть установлен
      expect(mockApp.currentActorId).toBeNull();
    });

    it('с префиксом "name:" при отсутствии совпадений — сообщение', async () => {
      const mockApp = {
        handleInput: mock(async () => JSON.stringify({ users: [] })),
        currentActorId: null,
      } as unknown as AnyAutoUiApp;

      const ctrl = new UserCliController(mockApp);
      const result = await ctrl.handleLogin("name: Неизвестный");
      expect(result).toContain("не найдены");
    });
  });

  describe("renderMenu()", () => {
    it("без пользователей: показывает /register", async () => {
      const mockApp = {
        handleInput: mock(async () => JSON.stringify({ users: [] })),
        currentActorId: null,
      } as unknown as AnyAutoUiApp;

      const ctrl = new UserCliController(mockApp);
      const menu = await ctrl.renderMenu();
      expect(menu).toContain("/register");
      expect(menu).not.toContain("/login");
    });

    it("с пользователями и без сессии: показывает /login", async () => {
      const mockApp = {
        handleInput: mock(async () =>
          JSON.stringify({ users: [{ uuid: "u1", name: "Иван" }] }),
        ),
        currentActorId: null,
      } as unknown as AnyAutoUiApp;

      const ctrl = new UserCliController(mockApp);
      const menu = await ctrl.renderMenu();
      expect(menu).toContain("/login");
      expect(menu).not.toContain("/register");
    });

    it("с активной сессией: показывает actorId", async () => {
      const mockApp = {
        handleInput: mock(async () =>
          JSON.stringify({ users: [{ uuid: "u1", name: "Иван" }] }),
        ),
        currentActorId: "u1",
      } as unknown as AnyAutoUiApp;

      const ctrl = new UserCliController(mockApp);
      const menu = await ctrl.renderMenu();
      expect(menu).toContain("Активный пользователь");
      expect(menu).toContain("u1");
    });

    it("если list-users падает — fallback-меню с /register", async () => {
      const mockApp = {
        handleInput: mock(async () => {
          throw new Error("DB error");
        }),
        currentActorId: null,
      } as unknown as AnyAutoUiApp;

      const ctrl = new UserCliController(mockApp);
      const menu = await ctrl.renderMenu();
      expect(menu).toContain("/register");
    });
  });

  describe("CLI-окружение", () => {
    it("createReadline() возвращает readline.Interface", () => {
      const mockApp = {} as AnyAutoUiApp;
      const ctrl = new UserCliController(mockApp);
      const rl = ctrl.createReadline();
      expect(rl).toBeDefined();
      expect(typeof rl.close).toBe("function");
    });

    it("writePrompt() выводит > ", () => {
      const writeSpy = spyOn(process.stdout, "write").mockImplementation(
        () => true,
      );
      const mockApp = {} as AnyAutoUiApp;
      const ctrl = new UserCliController(mockApp);
      ctrl.writePrompt();
      expect(writeSpy).toHaveBeenCalledWith("\n> ");
      writeSpy.mockRestore();
    });

    it("handleQuit() выводит До свидания!", () => {
      const logSpy = spyOn(console, "log").mockImplementation(() => {});
      const mockApp = {} as AnyAutoUiApp;
      const ctrl = new UserCliController(mockApp);
      ctrl.handleQuit();
      expect(logSpy).toHaveBeenCalledWith("До свидания!");
      logSpy.mockRestore();
    });
  });

  describe("REPL-цикл через AutoUiCliController.run()", () => {
    it("полный сценарий: about → меню → /register", async () => {
      const mockApp = {
        handleInput: mock(async (text: string) => {
          if (text === "/app") return "Приветствие";
          if (text === "/user/user/create-user") return "prompt: данные";
          if (text === "/user/user/list-users") return JSON.stringify({ users: [] });
          return "ok";
        }),
        currentActorId: null,
      } as unknown as AnyAutoUiApp;

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

      const ctrl = new UserCliController(mockApp);
      await ctrl.run();

      // Должен вывести about и меню с /register
      expect(logSpy).toHaveBeenCalledWith("\nПриветствие");
      const menuCalls = logSpy.mock.calls
        .map((c) => c[0])
        .filter((s) => typeof s === "string" && s.includes("/register"));
      expect(menuCalls.length).toBeGreaterThan(0);

      // Должен вывести ответ register
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
