import { describe, expect, test } from "bun:test";
import * as v from "valibot";
import type { Question } from "./question";
import { QuestionPoolService } from "./question-pool-service";

describe("QuestionPoolService", () => {
	test("загружает корректный пул из JSON", () => {
		const service = new QuestionPoolService();
		const all = service.getAll();
		expect(all.length).toBe(9);
		expect(all[0]?.questionCode).toBe("how_found");
	});

	test("getByCode возвращает вопрос по коду", () => {
		const service = new QuestionPoolService();
		const q = service.getByCode("intensity");
		expect(q).toBeDefined();
		expect(q?.questionCode).toBe("intensity");
	});

	test("getByCode возвращает undefined для несуществующего кода", () => {
		const service = new QuestionPoolService();
		expect(service.getByCode("nonexistent")).toBeUndefined();
	});

	test("buildValidationSchema для text — валидирует непустую строку", () => {
		const service = new QuestionPoolService([
			{
				question: "Текстовый вопрос",
				questionCode: "text_q",
				type: "text",
			},
		]);
		const schema = service.buildValidationSchema("text_q");
		expect(() => v.parse(schema, "hello")).not.toThrow();
		expect(() => v.parse(schema, "")).toThrow();
	});

	test("buildValidationSchema для single choice — валидирует picklist", () => {
		const service = new QuestionPoolService();
		const schema = service.buildValidationSchema("intensity");
		expect(() => v.parse(schema, "base")).not.toThrow();
		expect(() => v.parse(schema, "invalid")).toThrow();
	});

	test("buildValidationSchema для multiple choice — валидирует массив", () => {
		const service = new QuestionPoolService();
		const schema = service.buildValidationSchema("how_found");
		expect(() => v.parse(schema, ["friends", "telegram"])).not.toThrow();
		expect(() => v.parse(schema, [])).toThrow();
		expect(() => v.parse(schema, ["invalid"])).toThrow();
	});

	test("падает при дублирующемся questionCode", () => {
		const pool: Question[] = [
			{
				question: "Q1",
				questionCode: "dup",
				type: "choice",
				multiple: false,
				answers: [{ answer: "A", answerCode: "a" }],
			},
			{
				question: "Q2",
				questionCode: "dup",
				type: "choice",
				multiple: false,
				answers: [{ answer: "B", answerCode: "b" }],
			},
		];
		expect(() => new QuestionPoolService(pool)).toThrow(
			"Дублирующийся questionCode: dup",
		);
	});

	test("падает при отсутствии answers у choice-вопроса", () => {
		const pool: Question[] = [
			{
				question: "Q1",
				questionCode: "no_answers",
				type: "choice",
				multiple: false,
				answers: [],
			} as unknown as Question,
		];
		expect(() => new QuestionPoolService(pool)).toThrow();
	});

	test("падает при наличии answers у text-вопроса", () => {
		const pool: Question[] = [
			{
				question: "Q1",
				questionCode: "text_with_answers",
				type: "text",
				answers: [{ answer: "A", answerCode: "a" }],
			} as unknown as Question,
		];
		expect(() => new QuestionPoolService(pool)).toThrow();
	});

	test("падает при дублирующемся answerCode внутри вопроса", () => {
		const pool: Question[] = [
			{
				question: "Q1",
				questionCode: "dup_answer",
				type: "choice",
				multiple: false,
				answers: [
					{ answer: "A", answerCode: "a" },
					{ answer: "B", answerCode: "a" },
				],
			},
		];
		expect(() => new QuestionPoolService(pool)).toThrow(
			"Дублирующийся answerCode",
		);
	});

	test("падает при невалидном condition.questionCode", () => {
		const pool: Question[] = [
			{
				question: "Q1",
				questionCode: "q1",
				type: "choice",
				multiple: false,
				answers: [{ answer: "A", answerCode: "a" }],
			},
			{
				question: "Q2",
				questionCode: "q2",
				type: "choice",
				multiple: false,
				condition: { questionCode: "missing", answerCodes: ["a"] },
				answers: [{ answer: "B", answerCode: "b" }],
			},
		];
		expect(() => new QuestionPoolService(pool)).toThrow(
			'condition в вопросе "q2" ссылается на несуществующий questionCode: missing',
		);
	});

	test("assertAllCodesExist проходит для существующих кодов", () => {
		const service = new QuestionPoolService([
			{
				question: "Q1",
				questionCode: "q1",
				type: "text",
			},
			{
				question: "Q2",
				questionCode: "q2",
				type: "text",
			},
		]);
		expect(() => service.assertAllCodesExist(["q1", "q2"])).not.toThrow();
	});

	test("assertAllCodesExist падает при отсутствующем коде", () => {
		const service = new QuestionPoolService([
			{
				question: "Q1",
				questionCode: "q1",
				type: "text",
			},
		]);
		expect(() => service.assertAllCodesExist(["q1", "missing"])).toThrow(
			'questionCode "missing" из includedQuestionCodes не найден в пуле',
		);
	});
});
