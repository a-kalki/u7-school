#!/usr/bin/env bun
import { join } from "node:path";
import { parseArgs } from "./args";
import { CourseService } from "../core/course-service";

const PACKAGE_ROOT = join(import.meta.dir, "../..");
const BASE_DIR = join(PACKAGE_ROOT, "www.w3schools.com");
const OUTPUT_DIR = join(PACKAGE_ROOT, "output");

function showHelp() {
  console.log(`
Использование: w3s <команда> [аргументы]

Команды:
  status  - Проверить состояние локального хранилища контента
  parse   - Запустить парсинг скачанных HTML-файлов
  enrich  - Обогатить данные курсов через ИИ (генерация сводок)
  clean   - Удалить СКАЧАННЫЕ исходники (HTML) курса из www.w3schools.com
  help    - Показать эту справку

Опции для 'parse', 'enrich', 'clean':
  --course N  Указать определенный курс (например: --course git)

Опции для 'parse':
  --force     Полная перезапись (удаляет папку курса перед началом)
  --new       Парсить только те файлы, которых еще нет в output/
`);
}

async function main() {
  const { command, args } = parseArgs(process.argv.slice(2));
  const service = new CourseService(BASE_DIR, OUTPUT_DIR);

  switch (command) {
    case "status": {
      const rawCourses = await service.getAvailableCourses();
      const parsedCourses = await service.getParsedCourses();

      console.log("\n=== СОСТОЯНИЕ КОНТЕНТА ===");

      // 1. Парсинг
      const toParse = rawCourses.filter((c) => !parsedCourses.includes(c));
      console.log(`\nДоступно для парсинга (${rawCourses.length}):`);
      if (rawCourses.length > 0) {
        for (const course of rawCourses) {
          const isNew = !parsedCourses.includes(course);
          console.log(`  ${isNew ? "[+]" : "[v]"} ${course.padEnd(15)} ${isNew ? "(новое)" : "(уже спарсено)"}`);
        }
      } else {
        console.log("  (нет исходных HTML файлов)");
      }

      // 2. Обогащение
      console.log(`\nДоступно для обогащения (${parsedCourses.length}):`);
      if (parsedCourses.length > 0) {
        for (const course of parsedCourses) {
          const { total, enriched } = await service.getEnrichmentStats(course);
          const status = enriched === total ? "[v]" : enriched === 0 ? "[ ]" : "[~]";
          console.log(`  ${status} ${course.padEnd(15)} ${enriched}/${total} уроков обогащено`);
        }
      } else {
        console.log("  (нет спарсенных курсов)");
      }
      console.log("");
      break;
    }
    case "parse": {
      const force = args.includes("--force");
      const onlyNew = args.includes("--new");
      let targetCourse: string | undefined;

      const courseIdx = args.indexOf("--course");
      if (courseIdx !== -1 && args[courseIdx + 1]) {
        targetCourse = args[courseIdx + 1].toLowerCase();
      }

      const available = await service.getAvailableCourses();
      let toProcess = available;

      if (targetCourse) {
        if (available.includes(targetCourse)) {
          toProcess = [targetCourse];
        } else {
          console.error(`Ошибка: Курс "${targetCourse}" не найден.`);
          return;
        }
      }

      console.log("--- ЗАПУСК ПАРСЕРА ---");
      for (const course of toProcess) {
        console.log(`Обработка курса: ${course}...`);
        await service.parseCourse(course, { force, onlyNew });
      }
      console.log("--- ПАРСИНГ ЗАВЕРШЕН ---");
      break;
    }
    case "enrich": {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.error("Ошибка: Переменная окружения GEMINI_API_KEY не установлена.");
        return;
      }

      const { AIService } = await import("../core/ai-service");
      const { EnrichmentService } = await import("../core/enrichment-service");

      const aiService = new AIService(apiKey);
      const enrichmentService = new EnrichmentService(OUTPUT_DIR, aiService);

      let targetCourse: string | undefined;
      const courseIdx = args.indexOf("--course");
      if (courseIdx !== -1 && args[courseIdx + 1]) {
        targetCourse = args[courseIdx + 1].toLowerCase();
      }

      const parsed = await service.getParsedCourses();
      let toProcess = parsed;

      if (targetCourse) {
        if (parsed.includes(targetCourse)) {
          toProcess = [targetCourse];
        } else {
          console.error(`Ошибка: Курс "${targetCourse}" не найден в output (нужно сначала выполнить parse).`);
          return;
        }
      }

      if (toProcess.length === 0) {
        console.log("Доступных курсов для обогащения не найдено.");
        return;
      }

      for (const course of toProcess) {
        await enrichmentService.enrichCourse(course);
      }
      break;
    }
    case "clean": {
      let targetCourse: string | undefined;
      const courseIdx = args.indexOf("--course");
      if (courseIdx !== -1 && args[courseIdx + 1]) {
        targetCourse = args[courseIdx + 1].toLowerCase();
      }

      if (!targetCourse) {
        console.error("Ошибка: Укажите курс для удаления через --course <название>");
        return;
      }

      const { rm } = await import("node:fs/promises");
      const { existsSync } = await import("node:fs");
      const courseSourceDir = join(BASE_DIR, targetCourse);

      if (existsSync(courseSourceDir)) {
        console.log(`Удаление исходных данных курса: ${targetCourse}...`);
        await rm(courseSourceDir, { recursive: true, force: true });
        console.log("Готово.");
      } else {
        console.log(`Исходные данные курса "${targetCourse}" не найдены.`);
      }
      break;
    }
    default:
      showHelp();
      break;
  }
}

await main();
