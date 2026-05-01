import { describe, test, expect } from "bun:test";
import * as v from "valibot";
import { CourseSchema, type Course } from "./course";

describe("Схема курса (Course)", () => {
  // Валидный курс для переиспользования в тестах
  const validCourse: Course = {
    id: "course-001",
    title: "Основы TypeScript",
    description: "Курс для начинающих по TypeScript",
    authorId: "550e8400-e29b-41d4-a716-446655440000",
    targetAudience: "Начинающие разработчики, желающие изучить типизированный JavaScript",
    goal: "Научить студентов использовать TypeScript в реальных проектах",
    result: "Студент сможет писать типобезопасный код на TypeScript",
    rules: "Выполнять все домашние задания, смотреть видео-уроки",
    additional: "Рекомендуется знание JavaScript на базовом уровне",
  };

  test("должна принимать валидный курс со всеми полями", () => {
    const result = v.safeParse(CourseSchema, validCourse);
    expect(result.success).toBe(true);
  });

  describe("Валидация обязательных полей", () => {
    test("должна отклонять курс без названия", () => {
      const { title, ...withoutTitle } = validCourse;
      const result = v.safeParse(CourseSchema, withoutTitle);
      expect(result.success).toBe(false);
    });

    test("должна отклонять курс с пустым названием", () => {
      const result = v.safeParse(CourseSchema, {
        ...validCourse,
        title: "",
      });
      expect(result.success).toBe(false);
    });

    test("должна отклонять курс без описания", () => {
      const { description, ...withoutDesc } = validCourse;
      const result = v.safeParse(CourseSchema, withoutDesc);
      expect(result.success).toBe(false);
    });

    test("должна отклонять курс без автора", () => {
      const { authorId, ...withoutAuthor } = validCourse;
      const result = v.safeParse(CourseSchema, withoutAuthor);
      expect(result.success).toBe(false);
    });
  });

  describe("Валидация необязательных полей", () => {
    test("должна принимать курс без targetAudience", () => {
      const { targetAudience, ...rest } = validCourse;
      const result = v.safeParse(CourseSchema, rest);
      expect(result.success).toBe(true);
    });

    test("должна принимать курс без goal", () => {
      const { goal, ...rest } = validCourse;
      const result = v.safeParse(CourseSchema, rest);
      expect(result.success).toBe(true);
    });

    test("должна принимать курс без result", () => {
      const { result, ...rest } = validCourse;
      const result_ = v.safeParse(CourseSchema, rest);
      expect(result_.success).toBe(true);
    });

    test("должна принимать курс без rules", () => {
      const { rules, ...rest } = validCourse;
      const result = v.safeParse(CourseSchema, rest);
      expect(result.success).toBe(true);
    });

    test("должна принимать курс без additional", () => {
      const { additional, ...rest } = validCourse;
      const result = v.safeParse(CourseSchema, rest);
      expect(result.success).toBe(true);
    });

    test("должна принимать курс только с обязательными полями", () => {
      const minimal = {
        id: "course-min",
        title: "Минимальный курс",
        description: "Только обязательные поля",
        authorId: "author-001",
      };
      const result = v.safeParse(CourseSchema, minimal);
      expect(result.success).toBe(true);
    });
  });
});
