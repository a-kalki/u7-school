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

        let fileName = lesson.fileName;
        if (!fileName) continue;

        // Определяем имя .md файла на диске
        let mdFileName = fileName;
        if (!mdFileName.endsWith(".md")) {
          if (mdFileName.includes(".")) {
            mdFileName = `${mdFileName.substring(0, mdFileName.lastIndexOf("."))}.md`;
          } else {
            mdFileName += ".md";
          }
        }

        const mdPath = join(courseDir, mdFileName);
        if (existsSync(mdPath)) {
          const content = readFileSync(mdPath, "utf-8");
          console.log(`  [process] ${lesson.title} ...`);

          const summary = await this.aiService.getSummary(lesson.title, content);

          if (summary) {
            lesson.summary = summary;
            lesson.fileName = mdFileName; // Синхронизируем расширение в JSON
            updated = true;
            
            // Фильтруем поля при сохранении
            const cleanSections = sections.map(s => ({
              topic: s.topic,
              lessons: s.lessons.map(l => ({
                title: l.title,
                fileName: l.fileName,
                url: l.url,
                ...(l.summary ? { summary: l.summary } : {})
              }))
            }));
            writeFileSync(syllabusPath, JSON.stringify(cleanSections, null, 2));
          }
        }
      }
    }

    if (!updated) {
      console.log(`  Для курса ${courseName} нет новых уроков для обработки.`);
    }
  }
}
