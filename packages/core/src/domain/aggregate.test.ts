import { describe, expect, test } from "bun:test";
import { Aggregate } from "./aggregate";
import type { ArMeta } from "./aggregate";
import { AppException } from "./errors";
import type { DomainError } from "./errors";

interface TestArError1 extends DomainError {
	name: "TestArError1";
}

interface TestArError2 extends DomainError {
	name: "TestArError2";
}

type TestArErrors = TestArError1 | TestArError2;

interface TestArMeta extends ArMeta {
	name: "TestAr";
	errors: TestArErrors;
}

class TestAggregate extends Aggregate<TestArMeta> {
	doSomethingBad() {
		this.throwError({
			name: "TestArError1",
			level: "domain",
			userMessage: "Bad thing happened",
			debugInfo: "test",
		});
	}
}

describe("Aggregate", () => {
	test("метод агрегата выбрасывает ошибку из объявленного пула", () => {
		const ar = new TestAggregate();
		
		let caught: unknown;
		try {
			ar.doSomethingBad();
		} catch (e) {
			caught = e;
		}

		expect(caught).toBeInstanceOf(AppException);
		const appEx = caught as AppException;
		expect(appEx.error.name).toBe("TestArError1");
	});
});
