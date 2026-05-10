import { describe, expect, test } from "bun:test";
import { Role } from "@u7/user/domain";
import type { User } from "@u7/user/domain";
import { Status } from "../status";
import { StepPolicy } from "./policy";

function makeActor(roles: Role[]): User {
  return {
    uuid: crypto.randomUUID(),
    name: "Тест",
    telegramId: 1,
    roles,
    createdAt: "2026-05-01T12:00",
  };
}

const step = {
  uuid: "550e8400-e29b-41d4-a716-446655440000",
  courseId: "660e8400-e29b-41d4-a716-446655440001",
  kind: "text" as const,
  description: "Шаг",
  status: Status.DRAFT,
  order: 1,
  createdAt: "2026-05-01T12:00",
};

describe("StepPolicy", () => {
  describe("canCreate", () => {
    test("ADMIN может создавать", () => {
      expect(StepPolicy.canCreate(makeActor([Role.ADMIN]))).toBe(true);
    });

    test("MENTOR может создавать", () => {
      expect(StepPolicy.canCreate(makeActor([Role.MENTOR]))).toBe(true);
    });

    test("STUDENT не может создавать", () => {
      expect(StepPolicy.canCreate(makeActor([Role.STUDENT]))).toBe(false);
    });
  });

  describe("canRead", () => {
    test("любой пользователь может читать", () => {
      expect(StepPolicy.canRead(makeActor([Role.STUDENT]), step)).toBe(true);
      expect(StepPolicy.canRead(makeActor([Role.ADMIN]), step)).toBe(true);
    });
  });

  describe("canEdit", () => {
    test("ADMIN может редактировать", () => {
      expect(StepPolicy.canEdit(makeActor([Role.ADMIN]), step)).toBe(true);
    });

    test("MENTOR не может редактировать напрямую", () => {
      expect(StepPolicy.canEdit(makeActor([Role.MENTOR]), step)).toBe(false);
    });

    test("STUDENT не может редактировать", () => {
      expect(StepPolicy.canEdit(makeActor([Role.STUDENT]), step)).toBe(false);
    });
  });
});
