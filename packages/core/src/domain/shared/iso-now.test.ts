import { describe, expect, test } from "bun:test";
import * as v from "valibot";
import { isoNow } from "./iso-now";

describe("isoNow", () => {
	test("должен возвращать строку в формате YYYY-MM-DDTHH:mm", () => {
		const result = isoNow();
		expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
	});

	test("результат должен проходить валидацию v.isoDateTime", () => {
		const schema = v.pipe(v.string(), v.isoDateTime("bad"));
		expect(v.safeParse(schema, isoNow()).success).toBe(true);
	});
});
