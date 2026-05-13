import { describe, expect, it } from "bun:test";
import * as v from "valibot";
import { formatValibotErrors } from "./format-valibot-errors";

describe("formatValibotErrors", () => {
	it("возвращает читаемый текст для ошибки поля объекта", () => {
		const schema = v.object({
			title: v.string(),
		});

		const result = v.safeParse(schema, { title: 123 });
		if (result.success) throw new Error("Ожидалась ошибка");

		const formatted = formatValibotErrors(result.issues);
		expect(formatted).toContain("Ошибки валидации:");
		expect(formatted).toContain('"title"');
		expect(formatted).toContain("string");
		expect(formatted).toContain("123");
	});

	it("возвращает читаемый многострочный текст с полями и причинами", () => {
		const schema = v.object({
			name: v.string(),
			age: v.number(),
		});

		const result = v.safeParse(schema, { name: "", age: "не число" });
		if (result.success) throw new Error("Ожидалась ошибка");

		const formatted = formatValibotErrors(result.issues);
		expect(formatted).toContain("Ошибки валидации:");
		expect(formatted).toContain('"age"');
		expect(formatted).toContain("number");
		expect(formatted).toContain('"не число"');
	});

	it("отображает допустимые значения для перечислений", () => {
		const schema = v.object({
			role: v.picklist(["admin", "user"] as const),
		});

		const result = v.safeParse(schema, { role: "guest" });
		if (result.success) throw new Error("Ожидалась ошибка");

		const formatted = formatValibotErrors(result.issues);
		expect(formatted).toContain("Ошибки валидации:");
		expect(formatted).toContain('"role"');
		expect(formatted).toContain('"admin"');
		expect(formatted).toContain('"user"');
		expect(formatted).toContain('"guest"');
	});

	it("корректно обрабатывает вложенные пути", () => {
		const schema = v.object({
			profile: v.object({
				email: v.pipe(v.string(), v.email()),
			}),
		});

		const result = v.safeParse(schema, {
			profile: { email: "not-an-email" },
		});
		if (result.success) throw new Error("Ожидалась ошибка");

		const formatted = formatValibotErrors(result.issues);
		expect(formatted).toContain("Ошибки валидации:");
		expect(formatted).toContain("email");
		expect(formatted).toContain('"not-an-email"');
	});

	it("возвращает общее сообщение для пустого списка issues", () => {
		const formatted = formatValibotErrors([]);
		expect(formatted).toBe("Ошибка валидации (нет деталей)");
	});
});
