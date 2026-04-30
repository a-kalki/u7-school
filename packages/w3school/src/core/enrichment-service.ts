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
    let sections: Section[] = JSON.parse(readFileSync(syllabusPath, "utf-8"));

    // НОРМАЛИЗАЦИЯ: Исправляем старые fileName (.html -> .md) и удаляем мусор
    let needsNormalization = false;
    const normalizedSections = sections.map(s => ({
      topic: s.topic,
      lessons: s.lessons
        .map(l => {
          let fileName = l.fileName;
          // Если fileName ведет на .html или .asp, но на диске есть .md
          if (!fileName.endsWith(".md")) {
            const potentialMd = fileName.includes(".") 
              ? `${fileName.substring(0, fileName.lastIndexOf("."))}.md`
              : `${fileName}.md`;
            
            if (existsSync(join(courseDir, potentialMd))) {
              fileName = potentialMd;
              needsNormalization = true;
            }
          }
          return {
            title: l.title,
            fileName: fileName,
            url: l.url,
            ...(l.summary ? { summary: l.summary } : {})
          };
        })
        .filter(l => {
          const exists = l.fileName.endsWith(".md") && existsSync(join(courseDir, l.fileName));
          if (!exists) needsNormalization = true;
          return exists;
        })
    })).filter(s => s.lessons.length > 0);

    if (needsNormalization) {
      console.log(`  [info] Нормализация syllabus.json для ${courseName}...`);
      sections = normalizedSections;
      writeFileSync(syllabusPath, JSON.stringify(sections, null, 2));
    }

    let updated = false;
    for (const section of sections) {
      for (const lesson of section.lessons) {
        if (lesson.summary) {
          console.log(`  [skip] ${lesson.title} (уже есть summary)`);
          continue;
        }

        const fileName = lesson.fileName;
        const mdPath = join(courseDir, fileName);
        
        if (existsSync(mdPath)) {
          const content = readFileSync(mdPath, "utf-8");
          console.log(`  [process] ${lesson.title} ...`);

          const summary = await this.aiService.getSummary(lesson.title, content);

          if (summary) {
            lesson.summary = summary;
            updated = true;
            
            // Сохраняем после каждого урока
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
