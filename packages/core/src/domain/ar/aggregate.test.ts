import * as v from "valibot";
import { describe, expect, test } from "bun:test";
import { AppException } from "../errors/errors";
import type { DomainError } from "../errors/errors";
import type { ArMeta } from "./aggregate";
import { Aggregate } from "./aggregate";

interface TestArError1 extends DomainError {
	name: "TestArError1";
	kind: "validation";
}

interface TestArError2 extends DomainError {
	name: "TestArError2";
	kind: "conflict";
}

type TestArErrors = TestArError1 | TestArError2;

interface TestArMeta extends ArMeta {
	name: "TestAr";
	errors: TestArErrors;
}

interface TestState {
	name: string;
	age: number;
}

const TestSchema = v.object({
	name: v.pipe(v.string(), v.nonEmpty("Имя не может быть пустым")),
	age: v.pipe(v.number(), v.minValue(0, "Возраст не может быть отрицательным")),
});

class TestAggregate extends Aggregate<TestState, TestArMeta> {
	constructor(state: unknown) {
		super(state, TestSchema);
	}

	doSomethingBad() {
		this.throwInvariant({ foo: "bad" }, "Bad thing happened");
	}
}

describe("Aggregate", () => {
	test("конструктор принимает валидное состояние", () => {
		const ar = new TestAggregate({ name: "Иван", age: 25 });
		expect(ar.state).toEqual({ name: "Иван", age: 25 });
	});

	test("состояние иммутабельно", () => {
		const ar = new TestAggregate({ name: "Иван", age: 25 });
		const state = ar.state;
		// @ts-expect-error
		state.name = "Хакер";
		expect(ar.state.name).toBe("Иван");
	});

	test("конструктор выбрасывает при невалидном состоянии", () => {
		expect(() => new TestAggregate({ name: "", age: -1 })).toThrow(
			AppException,
		);
		try {
			new TestAggregate({ name: "", age: -1 });
		} catch (e) {
			const appEx = e as AppException;
			expect(appEx.error.name).toBe("AR_INVARIANT_ERROR");
			expect(appEx.error.message).toBe("Нарушены инварианты агрегата");
		}
	});

	test("метод агрегата выбрасывает ошибку из объявленного пула", () => {
		const ar = new TestAggregate({ name: "Test", age: 1 });
		let caught: unknown;
		try {
			ar.doSomethingBad();
		} catch (e) {
			caught = e;
		}
		expect(caught).toBeInstanceOf(AppException);
		const appEx = caught as AppException;
		expect(appEx.error.name).toBe("AR_INVARIANT_ERROR");
		expect(appEx.error.message).toBe("Bad thing happened");
		expect(appEx.error.payload).toEqual({ foo: "bad" });
	});
});
