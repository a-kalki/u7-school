import { describe, expect, test } from "bun:test";
import { questionnaireConfig } from "./config";

describe("questionnaireConfig", () => {
  test("имеет версию", () => {
    expect(questionnaireConfig.version).toBe("1.0.0");
  });

  test("содержит все обязательные вопросы", () => {
    const fields = questionnaireConfig.questions.map((q) => q.field);
    expect(fields).toContain("source");
    expect(fields).toContain("interestReason");
    expect(fields).toContain("experience");
    expect(fields).toContain("format");
    expect(fields).toContain("goals");
    expect(fields).toContain("intensity");
  });

  test("содержит условные вопросы", () => {
    const fields = questionnaireConfig.questions.map((q) => q.field);
    expect(fields).toContain("baseDays");
    expect(fields).toContain("baseTime");
    expect(fields).toContain("intensiveTime");
  });

  test("каждый вопрос имеет текст", () => {
    for (const q of questionnaireConfig.questions) {
      expect(q.text).toBeTruthy();
      expect(q.text.length).toBeGreaterThan(0);
    }
  });

  test("вопросы с выбором имеют options", () => {
    const choiceQuestions = questionnaireConfig.questions.filter(
      (q) => q.type === "single_choice" || q.type === "conditional_choice",
    );
    for (const q of choiceQuestions) {
      expect(q.options).toBeDefined();
      expect(q.options?.length).toBeGreaterThan(0);
    }
  });

  test("source имеет 5 вариантов", () => {
    const q = questionnaireConfig.questions.find((q) => q.field === "source");
    expect(q?.options).toHaveLength(5);
  });

  test("experience имеет 4 варианта", () => {
    const q = questionnaireConfig.questions.find(
      (q) => q.field === "experience",
    );
    expect(q?.options).toHaveLength(4);
  });

  test("условные вопросы имеют condition", () => {
    const conditional = questionnaireConfig.questions.filter(
      (q) => q.type === "conditional_choice",
    );
    for (const q of conditional) {
      expect(q.condition).toBeDefined();
      expect(q.condition?.field).toBe("intensity");
    }
  });

  test("все коды options уникальны в рамках вопроса", () => {
    for (const q of questionnaireConfig.questions) {
      if (!q.options) continue;
      const codes = q.options.map((o) => o.code);
      const uniqueCodes = new Set(codes);
      expect(uniqueCodes.size).toBe(codes.length);
    }
  });

  test("все метки options непустые", () => {
    for (const q of questionnaireConfig.questions) {
      if (!q.options) continue;
      for (const opt of q.options) {
        expect(opt.label).toBeTruthy();
        expect(opt.label.length).toBeGreaterThan(0);
      }
    }
  });
});
