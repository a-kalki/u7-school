import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { AIService } from "./ai-service";
import type { Section } from "./types";

export class EnrichmentService {
  constructor(
    private outputDir: string,
    private aiService: AIService,
  ) {}

  async enrichCourse(courseName: string): Promise<void> {
    const courseDir = join(this.outputDir, courseName);
    const syllabusPath = join(courseDir, "syllabus.json");

    if (!existsSync(syllabusPath)) {
      console.warn(`[!] syllabus.json не найден для курса ${courseName}`);
      return;
    }

    console.log(`\n>>> Обогащение курса: ${courseName.toUpperCase()}`);
    const sections: Section[] = JSON.parse(readFileSync(syllabusPath, "utf-8"));

    let updated = false;
    for (const section of sections) {
      for (const lesson of section.lessons) {
        if (lesson.summary) {
          console.log(`  [skip] ${lesson.title} (уже есть summary)`);
          continue;
        }

        const mdFile = lesson.mdFile;
        if (!mdFile) continue;

        const mdPath = join(courseDir, mdFile);
        if (existsSync(mdPath)) {
          const content = readFileSync(mdPath, "utf-8");
          console.log(`  [process] ${lesson.title} ...`);

          const summary = await this.aiService.getSummary(lesson.title, content);

          if (summary) {
            lesson.summary = summary;
            updated = true;
            // Сохраняем после каждого урока, чтобы не терять прогресс
            writeFileSync(syllabusPath, JSON.stringify(sections, null, 2));
          }
        }
      }
    }

    if (!updated) {
      console.log(`  Для курса ${courseName} нет новых уроков для обработки.`);
    }
  }
}
