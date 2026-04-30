import { expect, test } from "bun:test";
import { getCourses } from "./index";

test("getCourses should return a list of available courses", async () => {
  const courses = await getCourses();
  expect(Array.isArray(courses)).toBe(true);
});
