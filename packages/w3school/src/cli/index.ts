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
  help    - Показать эту справку

Опции для 'parse':
  --force     Полная перезапись (удаляет папку курса перед началом)
  --new       Парсить только те файлы, которых еще нет в output/
  --course N  Парсить только определенный курс (например: --course git)
`);
}

async function main() {
  const { command, args } = parseArgs(process.argv.slice(2));
  const service = new CourseService(BASE_DIR, OUTPUT_DIR);

  switch (command) {
    case "status": {
      const courses = await service.getAvailableCourses();
      console.log(`Найдено доступных курсов: ${courses.length}`);
      if (courses.length > 0) {
        console.log(`Курсы: ${courses.join(", ")}`);
      }
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
    case "enrich":
      console.log("Выполнение команды: enrich (в разработке)");
      break;
    default:
      showHelp();
      break;
  }
}

await main();
