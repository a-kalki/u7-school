import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { CourseService } from "./course-service";

describe("CourseService", () => {
	const TEST_BASE_DIR = "test-w3s-data";
	const TEST_OUTPUT_DIR = "test-output";

	beforeAll(async () => {
		await mkdir(TEST_BASE_DIR, { recursive: true });
		await mkdir(join(TEST_BASE_DIR, "html"), { recursive: true });
		await writeFile(
			join(TEST_BASE_DIR, "html", "default.asp.html"),
			'<div id="leftmenuinnerinner"><h2>Basic</h2><a target="_top" href="intro.html">Intro</a></div>',
		);
		await writeFile(
			join(TEST_BASE_DIR, "html", "intro.html"),
			'<div id="main"><h1>Intro</h1><p>Content</p></div>',
		);
	});

	afterAll(async () => {
		await rm(TEST_BASE_DIR, { recursive: true, force: true });
		await rm(TEST_OUTPUT_DIR, { recursive: true, force: true });
	});

	test("should get available courses", async () => {
		const service = new CourseService(TEST_BASE_DIR, TEST_OUTPUT_DIR);
		const courses = await service.getAvailableCourses();
		expect(courses).toContain("html");
	});

	test("should get parsed courses and enrichment stats", async () => {
		const service = new CourseService(TEST_BASE_DIR, TEST_OUTPUT_DIR);
		await service.parseCourse("html");

		const parsed = await service.getParsedCourses();
		expect(parsed).toContain("html");

		const stats = await service.getEnrichmentStats("html");
		expect(stats.total).toBe(1);
		expect(stats.enriched).toBe(0);

		// Симулируем обогащение
		const { readFileSync, writeFileSync } = await import("node:fs");
		const syllabusPath = join(TEST_OUTPUT_DIR, "html", "syllabus.json");
		const syllabus = JSON.parse(readFileSync(syllabusPath, "utf-8"));
		syllabus[0].lessons[0].summary = "Done";
		writeFileSync(syllabusPath, JSON.stringify(syllabus));

		const newStats = await service.getEnrichmentStats("html");
		expect(newStats.enriched).toBe(1);
	});

	test("should parse course and generate output", async () => {
		const service = new CourseService(TEST_BASE_DIR, TEST_OUTPUT_DIR);
		await service.parseCourse("html");

		expect(existsSync(join(TEST_OUTPUT_DIR, "html", "syllabus.json"))).toBe(
			true,
		);
		expect(existsSync(join(TEST_OUTPUT_DIR, "html", "intro.md"))).toBe(true);
	});
});
