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

describe("AutoUiApp", () => {
	it("должен рендерить about и список модулей", async () => {
		const mockModule = new MockAutoUiModule() as unknown as GeneralAutoUiModule;
		const app = new AutoUiApp([mockModule], { aboutPath: "mock" });
		app.about = { title: "Главное приложение", body: "Текст приложения" };

		const aboutResponse = await app.handleInput("/app");
		expect(aboutResponse).toContain("**Главное приложение**");
		expect(aboutResponse).toContain("Текст приложения");
		expect(aboutResponse).toContain("/modules");

		const modulesResponse = await app.handleInput("/modules");
		expect(modulesResponse).toContain("**Доступные модули:**");
		expect(modulesResponse).toContain("- Тестовый Модуль: /testmod");
	});

	it("должен маршрутизировать команды в модуль", async () => {
		const mockModule = new MockAutoUiModule() as unknown as GeneralAutoUiModule;
		const app = new AutoUiApp([mockModule], { aboutPath: "mock" });

		const response = await app.handleInput("/testmod");
		expect(response).toBe("handled-module");
	});

	it("должен возвращать ошибку при неизвестном модуле", async () => {
		const app = new AutoUiApp([], { aboutPath: "mock" });

		const response = await app.handleInput("/unknownmod");
		expect(response).toContain("Ошибка: Модуль 'unknownmod' не найден");
	});

	it("должен обрабатывать /register через модуль с create-user", async () => {
		const mockModule = new MockAutoUiModule() as unknown as GeneralAutoUiModule;
		mockModule.resolver.apiModule.getDocTypes = mock(() => [
			{ commandName: "create-user", arName: "user", arLabel: "Пользователь" },
		]);
		mockModule.name = "user";
		mockModule.handleIntent = mock(async (intent: UIIntent) => {
			if (intent.type === "usecase" && intent.action === "prompt")
				return "create-user prompt";
			return "ok";
		});

		const app = new AutoUiApp([mockModule], { aboutPath: "mock" });
		const response = await app.handleInput("/register");
		expect(response).toContain("Регистрация первого администратора");
		expect(response).toContain("create-user prompt");
	});

	it("/login без аргументов показывает список пользователей", async () => {
		const mockModule = new MockAutoUiModule() as unknown as GeneralAutoUiModule;
		mockModule.resolver.apiModule.getDocTypes = mock(() => [
			{ commandName: "list-users", arName: "user", arLabel: "Пользователь" },
		]);
		mockModule.name = "user";
		mockModule.resolver.apiModule.handle = mock(async () => ({
			users: [
				{ uuid: "u1", name: "Иван" },
				{ uuid: "u2", name: "Мария" },
			],
		}));

		const app = new AutoUiApp([mockModule], { aboutPath: "mock" });
		const response = await app.handleInput("/login");
		expect(response).toContain("**Выберите пользователя:**");
		expect(response).toContain("Иван");
		expect(response).toContain("/login u1");
		expect(response).toContain("Мария");
		expect(response).toContain("/login u2");
	});

	it("/login с userId устанавливает текущего пользователя", async () => {
		const mockModule = new MockAutoUiModule() as unknown as GeneralAutoUiModule;
		mockModule.resolver.apiModule.getDocTypes = mock(() => [
			{ commandName: "list-users", arName: "user", arLabel: "Пользователь" },
		]);
		mockModule.name = "user";

		const app = new AutoUiApp([mockModule], { aboutPath: "mock" });
		const response = await app.handleInput("/login user-123");
		expect(response).toContain("**Вход выполнен.**");
		expect(response).toContain("user-123");
		expect(app.currentActorId).toBe("user-123");
	});
});
