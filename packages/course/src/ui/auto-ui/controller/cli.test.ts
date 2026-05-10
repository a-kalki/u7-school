import { describe, expect, test } from "bun:test";
import { CourseCliController } from "./cli";

describe("CourseCliController", () => {
  test("создаётся экземпляр", () => {
    const controller = new CourseCliController();
    expect(controller).toBeDefined();
  });
});
