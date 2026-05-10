import { describe, expect, it, mock } from "bun:test";
import type { AutoUiApp } from "@u7/core/ui";
import { AutoUiCliController } from "@u7/core/ui";
import { CourseCliController } from "./cli";

// biome-ignore lint/suspicious/noExplicitAny: тестовый мок
type AnyAutoUiApp = AutoUiApp<any>;

function mockApp(overrides: Partial<AnyAutoUiApp> = {}): AnyAutoUiApp {
	return {
		handleInput: mock(async () => "ok"),
		callUseCase: mock(async () => ({ courses: [] })),
		currentActor: null,
		...overrides,
	} as unknown as AnyAutoUiApp;
}

describe("CourseCliController", () => {
	it("расширяет AutoUiCliController", () => {
		const app = mockApp();
		const ctrl = new CourseCliController(app);
		expect(ctrl).toBeInstanceOf(AutoUiCliController);
	});

	it("renderMenu показывает меню курсов", async () => {
		const app = mockApp({
			callUseCase: mock(async () => ({
				courses: [{ uuid: "c1", title: "Курс JS", kind: "modules" }],
			})),
		});
		const ctrl = new CourseCliController(app);
		const menu = await ctrl.renderMenu();
		expect(menu).toContain("**Меню курсов:**");
		expect(menu).toContain("Курс JS");
		expect(menu).toContain("create-course");
	});

	it("renderMenu с пустым списком курсов", async () => {
		const app = mockApp({
			callUseCase: mock(async () => ({ courses: [] })),
		});
		const ctrl = new CourseCliController(app);
		const menu = await ctrl.renderMenu();
		expect(menu).toContain("Курсы не найдены");
	});
});
