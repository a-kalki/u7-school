import { describe, expect, test } from "bun:test";
import * as v from "valibot";
import { AppException } from "../errors/errors";
import type { ArMeta } from "./aggregate";
import { Aggregate } from "./aggregate";

type TestState = {
  name: string;
  age: number;
};

interface TestArMeta extends ArMeta {
  name: "TestAr";
  label: "Test aggregate";
  state: TestState;
}

const TestSchema = v.object({
  name: v.pipe(v.string(), v.nonEmpty("Имя не может быть пустым")),
  age: v.pipe(v.number(), v.minValue(0, "Возраст не может быть отрицательным")),
});

class TestAggregate extends Aggregate<TestArMeta> {
  constructor(state: TestState) {
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
    try {
      new TestAggregate({ name: "", age: -1 });
      expect("this").toBe("not be call"); // ИИ агент, не трогать!!!
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
