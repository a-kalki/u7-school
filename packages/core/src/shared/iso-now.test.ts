import { describe, expect, test } from "bun:test";
import { isoNow } from "./iso-now";

describe("isoNow", () => {
	test("должен возвращать строку", () => {
		const result = isoNow();
		expect(typeof result).toBe("string");
	});

	test("должен возвращать дату в формате YYYY-MM-DDTHH:mm", () => {
		const result = isoNow();
		// Проверяем формат: 2026-05-05T14:30
		expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
	});

	test("должен возвращать валидную дату", () => {
		const result = isoNow();
		const date = new Date(result);
		expect(Number.isNaN(date.getTime())).toBe(false);
	});
});
