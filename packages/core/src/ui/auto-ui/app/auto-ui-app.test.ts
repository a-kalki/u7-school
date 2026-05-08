import { describe, expect, it, mock } from "bun:test";
import type { ModuleMeta } from "#domain/module/types";
import type { UIAppResolver } from "#ui/ui-base/ui-app";
import { AutoUiApp } from "./auto-ui-app";
import type { AutoUiModule, AutoUiModuleResolver } from "../module/auto-ui-module";
import type { UIIntent } from "../parser/command-parser";

type GeneralAutoUiModule = AutoUiModule<
	ModuleMeta,
	UIAppResolver,
	AutoUiModuleResolver<ModuleMeta>
>;

// Заглушка для AutoUiModule
class MockAutoUiModule {
	name = "testmod";
	about = { title: "Тестовый Модуль", body: "Описание модуля" };
	resolver = {
		aboutPath: ".",
		apiModule: {
			getDocTypes: mock(() => []),
			handle: mock(async () => ({})),
		},
	};

	async init() {}

	async handleIntent(intent: UIIntent): Promise<string> {
		return `handled-${intent.type}`;
	}
}

describe("AutoUiApp (очищенный)", () => {
	it("/app рендерит about через render() (без register/login)", async () => {
		const mockModule = new MockAutoUiModule() as unknown as GeneralAutoUiModule;
		const app = new AutoUiApp([mockModule], { aboutPath: "mock" });
		app.about = { title: "Главное приложение", body: "Текст приложения" };

		const response = await app.handleInput("/app");
		expect(response).toContain("**Главное приложение**");
		expect(response).toContain("Текст приложения");
		expect(response).toContain("/modules");
		// НЕ должно быть register/login
		expect(response).not.toContain("/register");
		expect(response).not.toContain("/login");
	});

	it("/modules рендерит список модулей", async () => {
		const mockModule = new MockAutoUiModule() as unknown as GeneralAutoUiModule;
		const app = new AutoUiApp([mockModule], { aboutPath: "mock" });

		const response = await app.handleInput("/modules");
		expect(response).toContain("**Доступные модули:**");
		expect(response).toContain("- Тестовый Модуль: /testmod");
	});

	it("handleInput НЕ содержит обработку register и login", async () => {
		const mockModule = new MockAutoUiModule() as unknown as GeneralAutoUiModule;
		const app = new AutoUiApp([mockModule], { aboutPath: "mock" });

		// /register и /login должны вернуть ошибку (неопознанная команда на уровне приложения)
		const registerResponse = await app.handleInput("/register");
		expect(registerResponse).toContain("Неопознанный ответ");

		const loginResponse = await app.handleInput("/login");
		expect(loginResponse).toContain("Неопознанный ответ");
	});

	it("currentActor сохраняется и читается", () => {
		const mockModule = new MockAutoUiModule() as unknown as GeneralAutoUiModule;
		const app = new AutoUiApp([mockModule], { aboutPath: "mock" });

		expect(app.currentActor).toBeNull();

		app.currentActor = { uuid: "u1", name: "Иван" };
		expect(app.currentActor).toEqual({ uuid: "u1", name: "Иван" });

		app.currentActor = null;
		expect(app.currentActor).toBeNull();
	});

	it("маршрутизирует команды в модуль", async () => {
		const mockModule = new MockAutoUiModule() as unknown as GeneralAutoUiModule;
		const app = new AutoUiApp([mockModule], { aboutPath: "mock" });

		const response = await app.handleInput("/testmod");
		expect(response).toBe("handled-module");
	});

	it("возвращает ошибку при неизвестном модуле", async () => {
		const app = new AutoUiApp([], { aboutPath: "mock" });

		const response = await app.handleInput("/unknownmod");
		expect(response).toContain("Ошибка: Модуль 'unknownmod' не найден");
	});

	it("передаёт currentActor.uuid в модуль при обработке intent", async () => {
		const mockModule = new MockAutoUiModule() as unknown as GeneralAutoUiModule;
		mockModule.handleIntent = mock(async (intent: UIIntent, actorId?: string) => {
			return `actor:${actorId}`;
		});

		const app = new AutoUiApp([mockModule], { aboutPath: "mock" });
		app.currentActor = { uuid: "user-1", name: "Иван" };

		const response = await app.handleInput("/testmod");
		expect(response).toBe("actor:user-1");
	});
});
