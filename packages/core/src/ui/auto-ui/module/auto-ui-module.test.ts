import { describe, expect, it } from "bun:test";
import * as v from "valibot";
import { Module } from "#api/module/module";
import type { UcDocType, UcMeta, UseCase } from "#api/uc/use-case";
import { AutoUiModule } from "./auto-ui-module";

type TestModuleMeta = { name: "testmod"; url: "testurl" };

class TestApiModule extends Module<TestModuleMeta, Record<string, unknown>> {
	override name = "testmod" as const;
	override useCases: UseCase<UcMeta, Record<string, unknown>>[] = [];

	override getDocTypes(): UcDocType[] {
		return [
			{
				ucName: "uc1",
				ucLabel: "Первая команда",
				arName: "agg1",
				arLabel: "Агрегат 1",
				type: "command",
				requiresAuth: false,
				// biome-ignore lint/suspicious/noExplicitAny: reason
				inputSchema: {} as any,
				// biome-ignore lint/suspicious/noExplicitAny: reason
				outputSchema: {} as any,
			},
			{
				ucName: "uc2",
				ucLabel: "Вторая команда",
				arName: "agg2",
				arLabel: "Агрегат 2",
				type: "command",
				requiresAuth: false,
				// biome-ignore lint/suspicious/noExplicitAny: reason
				inputSchema: {} as any,
				// biome-ignore lint/suspicious/noExplicitAny: reason
				outputSchema: {} as any,
			},
			{
				ucName: "uc3",
				ucLabel: "Создать пользователя",
				arName: "user",
				arLabel: "Пользователь",
				type: "command",
				requiresAuth: false,
				inputSchema: v.object({
					name: v.string(),
					email: v.pipe(v.string(), v.email()),
					role: v.picklist(["admin", "mentor", "student"] as const),
					age: v.optional(v.number()),
					tags: v.array(v.string()),
				}),
				outputSchema: v.any(),
			},
		];
	}
	override async handle(cmd: { name: string; attrs: Record<string, unknown> }) {
		if (cmd.name === "uc1")
			return { success: true, received: cmd.attrs._rawPayload };
		if (cmd.name === "uc3") return { success: true, attrs: cmd.attrs };
		throw new Error("Test error");
	}
}

class TestAutoUiModule extends AutoUiModule<
	TestModuleMeta,
	{ aboutPath: "." },
	{ aboutPath: "."; apiModule: TestApiModule }
> {
	name = "testmod" as const;
}

describe("auto-ui-module", () => {
	const apiModule = new TestApiModule();

	it("должен рендерить about", async () => {
		const mod = new TestAutoUiModule({ aboutPath: ".", apiModule });
		mod.about = { title: "Тайтл", body: "Описание" }; // вместо init();

		const response = await mod.handleIntent({
			type: "module",
			moduleName: "testmod",
			command: "about",
		});
		expect(response).toContain("Тайтл");
		expect(response).toContain("/testmod/aggregates");
	});

	it("должен вычислять и рендерить список агрегатов", async () => {
		const mod = new TestAutoUiModule({ aboutPath: ".", apiModule });

		const response = await mod.handleIntent({
			type: "module",
			moduleName: "testmod",
			command: "aggregates",
		});
		expect(response).toContain("Агрегат 1 (agg1)");
		expect(response).toContain("/testmod/agg1");
		expect(response).toContain("Агрегат 2 (agg2)");
	});

	it("должен рендерить список usecase для агрегата", async () => {
		const mod = new TestAutoUiModule({ aboutPath: ".", apiModule });

		const response = await mod.handleIntent({
			type: "module",
			moduleName: "testmod",
			aggregateName: "agg1",
			command: "usecases",
		});
		expect(response).toContain("Первая команда");
		expect(response).toContain("/testmod/agg1/uc1");
		expect(response).not.toContain("Вторая команда");
	});

	it("должен генерировать prompt для usecase", async () => {
		const mod = new TestAutoUiModule({ aboutPath: ".", apiModule });

		const response = await mod.handleIntent({
			type: "usecase",
			moduleName: "testmod",
			aggregateName: "agg1",
			commandName: "uc1",
			action: "prompt",
		});
		expect(response).toContain('Для выполнения команды "Первая команда"');
		expect(response).toContain("/testmod/agg1/uc1");
	});

	it("должен выполнять usecase и возвращать результат", async () => {
		const mod = new TestAutoUiModule({ aboutPath: ".", apiModule });

		const response = await mod.handleIntent({
			type: "usecase",
			moduleName: "testmod",
			aggregateName: "agg1",
			commandName: "uc1",
			action: "execute",
			payload: ["val1", "val2"],
		});
		expect(response).toContain("Успех!");
		expect(response).toContain("val1");
		expect(response).toContain("val2");
	});

	it("должен коэрсить строки в типы согласно схеме (number)", async () => {
		const mod = new TestAutoUiModule({ aboutPath: ".", apiModule });

		const response = await mod.handleIntent({
			type: "usecase",
			moduleName: "testmod",
			aggregateName: "user",
			commandName: "uc3",
			action: "execute",
			payload: ["Иван", "ivan@test.com", "mentor", "25", "1, 2, 3"],
		});

		expect(response).toContain("**Успех!**");
		// age должно быть числом 25, а не строкой "25"
		expect(response).toContain('"age": 25');
		// tags — массив строк (схема v.array(v.string())), остаются строками
		expect(response).toContain('"1"');
		expect(response).toContain('"2"');
		expect(response).toContain('"3"');
	});

	it("должен генерировать детальный prompt с типами и допустимыми значениями", async () => {
		const mod = new TestAutoUiModule({ aboutPath: ".", apiModule });

		const response = await mod.handleIntent({
			type: "usecase",
			moduleName: "testmod",
			aggregateName: "user",
			commandName: "uc3",
			action: "prompt",
		});

		// Текущий блок кода сохранён
		expect(response).toContain('Для выполнения команды "Создать пользователя"');
		expect(response).toContain("/testmod/user/uc3");
		expect(response).toContain("```");

		// Детальная информация о параметрах вне блока кода
		expect(response).toContain("**Параметры:**");
		expect(response).toContain("**name**");
		expect(response).toContain("string");
		expect(response).toContain("**role**");
		expect(response).toContain("admin");
		expect(response).toContain("mentor");
		expect(response).toContain("student");
		expect(response).toContain("**age**");
		expect(response).toContain("опционально");
		expect(response).toContain("number");
		expect(response).toContain("**tags**");
		expect(response).toContain("массив");
		expect(response).toContain("через запятую");
	});

	it("должен разбивать строку с запятыми для полей-массивов", async () => {
		const mod = new TestAutoUiModule({ aboutPath: ".", apiModule });

		const response = await mod.handleIntent({
			type: "usecase",
			moduleName: "testmod",
			aggregateName: "user",
			commandName: "uc3",
			action: "execute",
			payload: ["Иван", "ivan@test.com", "mentor", "25", "js, ts, html"],
		});

		expect(response).toContain("**Успех!**");
		expect(response).toContain('"js"');
		expect(response).toContain('"ts"');
		expect(response).toContain('"html"');
	});

	it("должен выбрасывать ошибки при выполнении usecase без перехвата", async () => {
		const mod = new TestAutoUiModule({ aboutPath: ".", apiModule });

		await expect(
			mod.handleIntent({
				type: "usecase",
				moduleName: "testmod",
				aggregateName: "agg2",
				commandName: "uc2",
				action: "execute",
				payload: [],
			}),
		).rejects.toThrow("Test error");
	});
});
