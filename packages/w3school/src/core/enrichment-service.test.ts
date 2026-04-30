import { expect, test, describe, beforeAll, afterAll, spyOn } from "bun:test";
import { mkdir, writeFile, rm, readFile } from "node:fs/promises";
import { join } from "node:path";
import { EnrichmentService } from "./enrichment-service";
import { AIService } from "./ai-service";

describe("EnrichmentService", () => {
  const TEST_OUTPUT_DIR = "test-enrich-output";

  beforeAll(async () => {
    await mkdir(join(TEST_OUTPUT_DIR, "html"), { recursive: true });
    const syllabus = [
      {
        topic: "Basic",
        lessons: [
          { title: "Intro", url: "url", fileName: "intro.md" }
        ]
      }
    ];
    await writeFile(join(TEST_OUTPUT_DIR, "html", "syllabus.json"), JSON.stringify(syllabus));
    await writeFile(join(TEST_OUTPUT_DIR, "html", "intro.md"), "Lesson content");
  });

  afterAll(async () => {
    await rm(TEST_OUTPUT_DIR, { recursive: true, force: true });
  });

  test("should enrich course with AI summaries", async () => {
    const aiService = new AIService("key");
    const getSummarySpy = spyOn(aiService, "getSummary").mockResolvedValue("AI Summary");

    const service = new EnrichmentService(TEST_OUTPUT_DIR, aiService);
    await service.enrichCourse("html");

    const updatedSyllabus = JSON.parse(await readFile(join(TEST_OUTPUT_DIR, "html", "syllabus.json"), "utf-8"));
    expect(updatedSyllabus[0].lessons[0].summary).toBe("AI Summary");
    expect(getSummarySpy).toHaveBeenCalled();

    getSummarySpy.mockClear();
    // Повторный запуск должен пропустить
    await service.enrichCourse("html");
    expect(getSummarySpy).not.toHaveBeenCalled();

    getSummarySpy.mockRestore();
  });
});
