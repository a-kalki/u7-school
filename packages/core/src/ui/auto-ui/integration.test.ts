import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as v from "valibot";
import { Module } from "#api/module/module";
import { UseCase } from "#api/uc/use-case";
import type { ArMeta } from "#domain/ar/aggregate";
import { Aggregate } from "#domain/ar/aggregate";
import { AutoUiApp } from "./app/auto-ui-app";
import { AutoUiModule } from "./module/auto-ui-module";

interface CourseArMeta extends ArMeta {
	name: "Course";
	label: "Курс";
	state: { uuid: string; createdAt: string; updatedAt?: string } & Record<
		string,
		unknown
	>;
}

class CourseAr extends Aggregate<CourseArMeta> {
	static readonly arName = "Course";
	static readonly arLabel = "Курс";
}

// 1. Доменный слой (API)
class CreateCourseUseCase extends UseCase<any, any> {
	protected readonly ucName = "create-course" as const;
	protected readonly ucLabel = "Создать новый курс" as const;
	protected readonly arMeta = {
		arName: "Course" as const,
		arLabel: "Курс" as const,
	};
	protected readonly type = "command" as const;
	protected readonly requiresAuth = false as const;
	protected readonly inputSchema = v.object({
		title: v.string(),
		description: v.string(),
	});
	protected readonly outputSchema = v.any();

	protected async getUser(_userId: string): Promise<Record<string, unknown>> {
		return {};
	}

	protected async execute(payload: any) {
		return { id: "123", title: payload.title };
	}
}

class CourseApiModule extends Module<any, any> {
	name = "courses" as const;
	useCases = [new CreateCourseUseCase()];
}

// 2. UI слой
class CourseUiModule extends AutoUiModule<{
	name: "courses";
	url: "/courses";
}> {
	override name = "courses" as const;
}

describe("AutoUI Integration", () => {
	const testDir = path.join(__dirname, "test-integration");

	beforeAll(async () => {
		await fs.mkdir(testDir, { recursive: true });
		await fs.writeFile(
			path.join(testDir, "about.md"),
			"# School App\nMain welcome",
		);

		const modDir = path.join(testDir, "courses");
		await fs.mkdir(modDir, { recursive: true });
		await fs.writeFile(
			path.join(modDir, "about.md"),
			"# Courses Module\nModule welcome",
		);
	});

	afterAll(async () => {
		await fs.rm(testDir, { recursive: true, force: true });
	});

	it("полный сценарий навигации и выполнения команды", async () => {
		const apiModule = new CourseApiModule();
		apiModule.init({});

		const uiModule = new CourseUiModule({
			aboutPath: path.join(testDir, "courses"),
			apiModule,
		});

		const app = new AutoUiApp([uiModule], { aboutPath: testDir });
		await app.init();

		// 1. Главная
		let response = await app.handleInput("/app");
		expect(response).toContain("School App");
		expect(response).toContain("/modules");

		// 2. Список модулей
		response = await app.handleInput("/modules");
		expect(response).toContain("Courses Module");
		expect(response).toContain("/courses");

		// 3. Модуль
		response = await app.handleInput("/courses");
		expect(response).toContain("Module welcome");
		expect(response).toContain("/courses/aggregates");

		// 4. Агрегаты
		response = await app.handleInput("/courses/aggregates");
		expect(response).toContain("Курс (Course): /courses/Course");

		// 5. UseCase List
		response = await app.handleInput("/courses/Course");
		expect(response).toContain(
			"Создать новый курс: /courses/Course/create-course",
		);

		// 6. UseCase Prompt
		response = await app.handleInput("/courses/Course/create-course");
		expect(response).toContain('Для выполнения команды "Создать новый курс"');

		// 7. Execute (с заглушкой маппинга)
		const input = "/courses/Course/create-course\n- JS Basics\n- Learn JS";
		response = await app.handleInput(input);
		expect(response).toContain("**Успех!**");
		expect(response).toContain("JS Basics");
	});
});
