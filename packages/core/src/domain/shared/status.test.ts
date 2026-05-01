import { describe, expect, test } from "bun:test";
import * as v from "valibot";
import { Status, StatusSchema } from "./status";

describe("Статусы (Status)", () => {
	test("должны быть определены DRAFT, PUBLISHED, ARCHIVED", () => {
		expect(Status.DRAFT).toBe("draft");
		expect(Status.PUBLISHED).toBe("published");
		expect(Status.ARCHIVED).toBe("archived");
	});

	test("StatusSchema должна пропускать валидные статусы", () => {
		expect(v.safeParse(StatusSchema, Status.DRAFT).success).toBe(true);
		expect(v.safeParse(StatusSchema, Status.PUBLISHED).success).toBe(true);
		expect(v.safeParse(StatusSchema, Status.ARCHIVED).success).toBe(true);
	});

	test("StatusSchema должна отклонять невалидные статусы", () => {
		expect(v.safeParse(StatusSchema, "deleted").success).toBe(false);
		expect(v.safeParse(StatusSchema, "").success).toBe(false);
	});
});
