import { describe, expect, test } from "bun:test";
import type { DomainError } from "../errors/errors";
import { AppException } from "../errors/errors";
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

class TestAggregate extends Aggregate<TestArMeta> {
  doSomethingBad() {
    this.throwInvariant({ name: ["Not be empty"] }, "Bad thing happened");
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
