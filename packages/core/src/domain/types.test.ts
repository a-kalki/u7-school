import { describe, expect, test } from "bun:test";
import type { DomainError, AppError } from "./errors/errors";
import type { ArMeta } from "./ar/aggregate";
import type { UcMeta } from "../api/uc/use-case";

// Compile-time assertions: эти функции вызовут ошибку компиляции,
// если соответствующие поля отсутствуют в типах.
function _assertArMetaHasLabel<T extends { label: string }>(_meta: T) {}
_assertArMetaHasLabel({} as ArMeta);

function _assertUcMetaHasDescription<T extends { description: string }>(_meta: T) {}
_assertUcMetaHasDescription({} as UcMeta);

function _assertUcMetaHasArMeta<T extends { arMeta: { name: string; label: string } }>(_meta: T) {}
_assertUcMetaHasArMeta({} as UcMeta);

function _assertUcMetaHasRequiresAuth<T extends { requiresAuth: boolean }>(_meta: T) {}
_assertUcMetaHasRequiresAuth({} as UcMeta);

function _assertUcMetaHasType<T extends { type: "command" | "query" }>(_meta: T) {}
_assertUcMetaHasType({} as UcMeta);

describe("ArMeta", () => {
  test("содержит поле label", () => {
    const meta: ArMeta = {
      name: "test-ar",
      label: "Тестовый агрегат",
      errors: {} as DomainError,
    };

    expect(meta.name).toBe("test-ar");
    expect(meta.label).toBe("Тестовый агрегат");
  });
});

describe("UcMeta", () => {
  test("содержит поля description, arMeta, requiresAuth, type", () => {
    const meta: UcMeta = {
      commandName: "test-cmd",
      description: "Тестовый use-case",
      arMeta: {
        name: "test-ar",
        label: "Тестовый агрегат",
        errors: {} as DomainError,
      },
      input: { foo: "bar" },
      output: { baz: 42 },
      errors: {} as AppError,
      requiresAuth: true,
      type: "command",
    };

    expect(meta.commandName).toBe("test-cmd");
    expect(meta.description).toBe("Тестовый use-case");
    expect(meta.arMeta.name).toBe("test-ar");
    expect(meta.arMeta.label).toBe("Тестовый агрегат");
    expect(meta.requiresAuth).toBe(true);
    expect(meta.type).toBe("command");
  });

  test("поддерживает type: 'query'", () => {
    const meta: UcMeta = {
      commandName: "test-query",
      description: "Тестовый запрос",
      arMeta: {
        name: "test-ar",
        label: "Тестовый агрегат",
        errors: {} as DomainError,
      },
      input: {},
      output: {},
      errors: {} as AppError,
      requiresAuth: false,
      type: "query",
    };

    expect(meta.type).toBe("query");
    expect(meta.requiresAuth).toBe(false);
  });
});
