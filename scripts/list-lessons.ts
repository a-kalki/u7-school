/**
 * list-lessons.ts — список модулей, проектов, уроков и шагов.
 *
 * ## Назначение
 * Выводит структуру курса: модули → проекты → уроки → количество шагов.
 * Одновременно является интеграционным тестом:
 *   - `list-modules` use-case (ModuleJsonRepo.getAll, visibility-политики)
 *   - `get-module-snapshot` use-case (LessonJsonRepo, CourseDs.buildSnapshot)
 *   - Корректность связей moduleId/lessonIds/stepIds в JSON-файлах
 *
 * ## Использование
 *   bun run scripts/list-lessons.ts             # все модули, все проекты
 *   bun run scripts/list-lessons.ts 2           # модуль 2
 *   bun run scripts/list-lessons.ts 2-1         # модуль 2, проект 1
 *   bun run scripts/list-lessons.ts 2:1         # то же
 *   bun run scripts/list-lessons.ts 2-1-3       # модуль 2, проект 1, урок 3 (детально)
 *   bun run scripts/list-lessons.ts 2:1:3       # то же
 *   bun run scripts/list-lessons.ts m2-p1-l3    # то же, явный формат
 *
 * ## Временные отступления
 * - **Подсчёт менторских файлов**: функция `countMentorFilesDirect()`
 *   читает `manifest.json` напрямую с диска, в обход API.
 *   Причина: менторские файлы ещё не интегрированы в use-case'ы
 *   (mentorStepIds в Lesson есть, но get-step для file-шагов не
 *   используется скриптами). Когда менторские шаги будут добавлены
 *   в уроки через create-step (kind: 'file'), функция будет заменена
 *   на `app.execute('get-step', { uuid })`.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { createApp, NUR_UUID } from './_app-factory';

const DATA_DIR = 'data/fullstack-js';

// ─── Справка ───

function showHelp() {
  console.log(`
list-lessons — список модулей, проектов, уроков и шагов.

Использование:
  bun run scripts/list-lessons.ts             # все модули, все проекты
  bun run scripts/list-lessons.ts 2           # модуль 2
  bun run scripts/list-lessons.ts 2:1         # модуль 2, проект 1
  bun run scripts/list-lessons.ts 2:1:4       # урок детально (UUID шагов)

Формат: M[:P[:L]] — модуль, проект, урок (вложенность)

Принцип: каждый запуск = интеграционный тест. Данные проходят
ModuleJsonRepo → list-modules → get-module-snapshot → get-lesson.
Если сломается схема в JSON-файлах, visibility-политика или любой
use-case — скрипт упадёт с ошибкой.
`);
}

// ─── Типы ───

interface ManifestFile {
  lessonUuid?: string;
  files: unknown[];
}

// Автоопределение имён папок модулей: m1-syntax, m2-algorithm, ...
const moduleDirs = readdirSync(DATA_DIR).sort();

// ─── ВРЕМЕННО: прямой подсчёт менторских файлов ───
// TODO: заменить на app.execute('get-step', { uuid }) для mentorStepIds,
//       когда менторские шаги будут добавлены в уроки через API.

/**
 * Считает количество менторских файлов для урока, читая manifest.json
 * напрямую с диска. Временное решение — будет заменено на API-вызов.
 */
function countMentorFilesDirect(moduleDir: string, projectDir: string): number {
  const manifestPath = `${DATA_DIR}/${moduleDir}/${projectDir}/mentor-files/manifest.json`;
  if (!existsSync(manifestPath)) return 0;
  try {
    const raw = JSON.parse(readFileSync(manifestPath, 'utf-8'));
    const files = Array.isArray(raw)
      ? raw
      : ((raw as ManifestFile).files ?? []);
    return files.length;
  } catch {
    return 0;
  }
}

// ─── Парсинг аргументов ───

interface Filter {
  module?: number; // 1-based
  project?: number; // 1-based
  lesson?: number; // 1-based
}

function parseFilter(arg: string): Filter | null {
  // M:P:L
  const m1 = arg.match(/^(\d+):(\d+):(\d+)$/);
  if (m1) {
    const mod = m1[1] as string;
    const proj = m1[2] as string;
    const les = m1[3] as string;
    return { module: +mod, project: +proj, lesson: +les };
  }

  // M:P
  const m2 = arg.match(/^(\d+):(\d+)$/);
  if (m2) {
    const mod = m2[1] as string;
    const proj = m2[2] as string;
    return { module: +mod, project: +proj };
  }

  // M
  const m3 = arg.match(/^(\d+)$/);
  if (m3) {
    const mod = m3[1] as string;
    return { module: +mod };
  }

  return null;
}

// ─── Поиск папки урока ───

function findLessonDir(moduleDir: string, prefix: string): string | undefined {
  const projectDirs = readdirSync(`${DATA_DIR}/${moduleDir}`);
  return projectDirs.find((d) => d.startsWith(prefix));
}

// ─── Основной вывод ───

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('-h') || args.includes('--help')) {
    showHelp();
    process.exit(0);
  }

  const app = createApp(true); // всегда silent — консольная утилита

  const filter = args[0] ? parseFilter(args[0]) : undefined;

  if (args[0] && !filter) {
    console.error(`❌ Некорректный фильтр: ${args[0]}`);
    console.error('   Формат: M[:P[:L]] — например: 2, 2:1, 2:1:4');
    process.exit(1);
  }

  // Получаем список модулей через API (тестирует list-modules + ModuleJsonRepo.getAll)
  type ModuleEntry = { uuid: string; title: string; status: string };
  const modules = (await app.execute(
    'list-modules',
    {},
    NUR_UUID,
  )) as ModuleEntry[];

  let mi = 0;
  for (const mod of modules) {
    mi++;
    const M = mi;
    const moduleDir = moduleDirs[mi - 1];

    if (!mod || !moduleDir) continue;
    if (filter?.module !== undefined && filter.module !== M) continue;

    // Получаем снимок модуля через API (тестирует get-module-snapshot + LessonJsonRepo)
    type SnapshotLesson = { lessonId: string; lessonTitle: string };
    type SnapshotProject = {
      projectTitle: string;
      lessons: SnapshotLesson[];
    };
    const snapshot = (await app.execute(
      'get-module-snapshot',
      { moduleId: mod.uuid },
      NUR_UUID,
    )) as SnapshotProject[];

    // Детальный вывод одного урока
    if (filter?.lesson !== undefined && filter?.project !== undefined) {
      const project = snapshot[filter.project - 1];
      if (!project) {
        console.error(`❌ Проект ${filter.project} не найден в модуле ${M}`);
        process.exit(1);
      }
      const lesson = project.lessons[filter.lesson - 1];
      if (!lesson) {
        console.error(
          `❌ Урок ${filter.lesson} не найден в проекте m${M}-p${filter.project}`,
        );
        process.exit(1);
      }

      // Получаем урок через API для получения stepIds (тестирует get-lesson)
      type LessonDetail = { stepIds: string[]; mentorStepIds: string[] };
      const lessonDetail = (await app.execute(
        'get-lesson',
        { uuid: lesson.lessonId },
        NUR_UUID,
      )) as LessonDetail;

      const dir = findLessonDir(
        moduleDir,
        `p${filter.project}-l${filter.lesson}-`,
      );
      const mentorFiles = countMentorFilesDirect(moduleDir, dir ?? '');

      const label = `m${M}-p${filter.project}-l${filter.lesson}`;
      console.log(`\n📖 ${label}: ${lesson.lessonTitle}`);
      const parts: string[] = [];
      if (lessonDetail.stepIds.length)
        parts.push(`📝 шагов: ${lessonDetail.stepIds.length}`);
      if (lessonDetail.mentorStepIds.length)
        parts.push(`👤 ментор-шагов: ${lessonDetail.mentorStepIds.length}`);
      if (mentorFiles) parts.push(`📁 ментор-файлов: ${mentorFiles}`);
      if (dir) parts.push(`📂 ${dir}`);
      console.log(`   ${parts.join(' | ')}`);
      console.log(`   stepIds: [${lessonDetail.stepIds.join(', ')}]`);
      if (lessonDetail.mentorStepIds.length)
        console.log(
          `   mentorStepIds: [${lessonDetail.mentorStepIds.join(', ')}]`,
        );
      return;
    }

    console.log(
      `\n📚 Модуль ${M}: ${mod.title} [${mod.status}] (${moduleDir})`,
    );

    for (let pi = 0; pi < snapshot.length; pi++) {
      const project = snapshot[pi];
      if (!project) continue;
      const P = pi + 1;

      if (filter?.project !== undefined && filter.project !== P) continue;

      const lessonCount = project.lessons.length;

      // Собираем статистику по шагам через API
      let totalSteps = 0;
      let totalMentorSteps = 0;
      let totalMentorFiles = 0;

      for (let li = 0; li < project.lessons.length; li++) {
        const lesson = project.lessons[li];
        if (!lesson) continue;
        const L = li + 1;
        const prefix = `p${P}-l${L}-`;
        const dir = findLessonDir(moduleDir, prefix);

        type LessonDetail = { stepIds: string[]; mentorStepIds: string[] };
        const detail = (await app.execute(
          'get-lesson',
          { uuid: lesson.lessonId },
          NUR_UUID,
        )) as LessonDetail;

        totalSteps += detail.stepIds.length;
        totalMentorSteps += detail.mentorStepIds.length;
        totalMentorFiles += countMentorFilesDirect(moduleDir, dir ?? '');
      }

      const parts: string[] = [];
      if (totalSteps) parts.push(`📝 ${totalSteps}`);
      if (totalMentorSteps) parts.push(`👤 ${totalMentorSteps}`);
      if (totalMentorFiles) parts.push(`📁 ${totalMentorFiles}`);

      console.log(
        `  📦 Проект m${M}-p${P}: ${project.projectTitle} (${lessonCount} уроков)`,
      );
      if (parts.length) console.log(`       шаги: ${parts.join(', ')}`);

      // Уроки
      for (let li = 0; li < project.lessons.length; li++) {
        const lesson = project.lessons[li];
        if (!lesson) continue;
        const L = li + 1;

        type LessonDetail = { stepIds: string[] };
        const detail = (await app.execute(
          'get-lesson',
          { uuid: lesson.lessonId },
          NUR_UUID,
        )) as LessonDetail;

        const steps = detail.stepIds.length;
        console.log(`       l${L}: ${lesson.lessonTitle} (${steps} шагов)`);
      }
    }
  }

  console.log();
}

main().catch((e) => {
  console.error('❌ Ошибка:', e);
  process.exit(1);
});
