import { describe, expect, test } from "bun:test";
import * as v from "valibot";
import type { CreateCourseCommand } from "./create_course_command";
import { CreateCourseCommandSchema } from "./create_course_command";

const validCmd: CreateCourseCommand = {
	title: "Курс",
	description: "Описание",
	authorId: "660e8400-e29b-41d4-a716-446655440001",
};

describe("CreateCourseCommand (схема валидации)", () => {
	test("должна принимать валидную команду", () => {
		expect(v.safeParse(CreateCourseCommandSchema, validCmd).success).toBe(true);
	});

	test("должна отклонять пустой title", () => {
		expect(v.safeParse(CreateCourseCommandSchema, { ...validCmd, title: "" }).success).toBe(false);
	});

	test("должна отклонять пустой description", () => {
		expect(v.safeParse(CreateCourseCommandSchema, { ...validCmd, description: "" }).success).toBe(false);
	});

	test("должна отклонять невалидный authorId", () => {
		expect(v.safeParse(CreateCourseCommandSchema, { ...validCmd, authorId: "bad" }).success).toBe(false);
	});
});
