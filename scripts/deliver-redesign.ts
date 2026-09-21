/**
 * deliver-redesign.ts — укладка переработанного контента «Алгоритмики» в БД.
 *
 * ## Назначение
 * Читает каталог черновиков (redesign-p1/ … redesign-p5/) со структурой
 * `pN-lM-<name>/lesson.md` и создаёт через боевые UC:
 *   - add-project  (метаданные из <dir>/project.json)
 *   - create-lesson (12 уроков: title/additional/estimatedMinutes из lesson.md)
 *   - create-step  (все шаги урока, kind: text, порядок как в файле)
 * После создания публикует новые сущности (status: published) — отдельные
 * publish-UC для урока/проекта/шага в системе нет, публикация прямой правкой
 * JSON-файлов по uuid из манифеста.
 *
 * ## Режимы
 *   bun run scripts/deliver-redesign.ts <dir>            # dry-run: только парсинг
 *   bun run scripts/deliver-redesign.ts <dir> --apply    # создать + опубликовать
 *   bun run scripts/deliver-redesign.ts --archive-old    # старые проекты модуля → archived
 *
 * ## Перед запуском --apply
 *   1. bash scripts/backup.sh before-migration
 *   2. pm2 stop u7-school-bot   (бот пишет в те же JSON — гонки недопустимы)
 *
 * ## Выход
 *   Манифест data/backup/redesign-manifest-<dir>.json (projectUuid, lessons[]),
 *   используется для публикации, снапшотов и документации.
 */
import { createApp, NUR_UUID } from './_app-factory';

const COURSES_DIR = 'data/courses';
const MODULE_TITLE = 'Алгоритмика';

// ─── Парсер lesson.md ───────────────────────────────

interface ParsedStep {
  description: string;
  content: string;
}

interface ParsedLesson {
  dir: string;
  title: string;
  additional: string;
  estimatedMinutes: number | undefined;
  steps: ParsedStep[];
}

/** Извлечь «Время:» → первое число минут (поддерживает «~40 мин», «90–120 мин») */
function parseMinutes(text: string): number | undefined {
  const m = text.match(/~?\s*(\d+)/);
  return m ? Number.parseInt(m[1], 10) : undefined;
}

function parseLessonMd(dir: string, md: string): ParsedLesson {
  // Заголовок урока: первая строка `# ...`
  const titleMatch = md.match(/^# (.+)$/m);
  if (!titleMatch) throw new Error(`${dir}: не найден заголовок «# …»`);
  const title = titleMatch[1].trim();

  // Время: строка `**Время:** ~40 мин`
  const timeMatch = md.match(/\*\*Время:\*\*(.+)/);
  const estimatedMinutes = timeMatch ? parseMinutes(timeMatch[1]) : undefined;

  // Краткое содержание: абзац после `**Краткое содержание:**` до пустой строки/следующего блока
  let additional = '';
  const addMatch = md.match(
    /\*\*Краткое содержание:\*\*\s*\n+([\s\S]*?)(?:\n\s*\n|\n\*\*|$)/,
  );
  if (addMatch) {
    additional = addMatch[1].replace(/\s+/g, ' ').trim();
  }
  if (!additional) {
    console.warn(`⚠️  ${dir}: пустое «Краткое содержание» — additional не задан`);
  }

  // Шаги: `#### Шаг N. Название` + тело до следующего шага/конца
  const steps: ParsedStep[] = [];
  const stepRegex = /^#### Шаг (\d+)\. (.+)$/gm;
  const marks: Array<{ headerStart: number; bodyStart: number; num: number; name: string }> = [];
  let m: RegExpExecArray | null;
  while ((m = stepRegex.exec(md)) !== null) {
    marks.push({
      headerStart: m.index,
      bodyStart: m.index + m[0].length,
      num: Number(m[1]),
      name: m[2].trim(),
    });
  }
  for (let i = 0; i < marks.length; i++) {
    const bodyStart = marks[i].bodyStart;
    const bodyEnd =
      i + 1 < marks.length ? marks[i + 1].headerStart : md.length;
    let body = md.slice(bodyStart, bodyEnd);
    // Убрать хвостовые разделители `---` и лишние пустые строки
    body = body.replace(/\n---\s*$/g, '').trim();
    if (!body) console.warn(`⚠️  ${dir}: пустое тело шага ${marks[i].num}`);
    steps.push({ description: marks[i].name, content: body });
  }
  if (steps.length === 0) throw new Error(`${dir}: не найдено шагов (#### Шаг N.)`);

  return { dir, title, additional, estimatedMinutes, steps };
}

// ─── Публикация (прямая правка JSON) ────────────────

interface ManifestLesson {
  dir: string;
  lessonUuid: string;
  title: string;
  stepUuids: string[];
}

interface Manifest {
  dir: string;
  projectUuid: string;
  lessons: ManifestLesson[];
}

async function publish(manifest: Manifest): Promise<void> {
  const now = new Date().toISOString().slice(0, 16);
  const newLessonIds = new Set(manifest.lessons.map((l) => l.lessonUuid));
  const newStepIds = new Set(manifest.lessons.flatMap((l) => l.stepUuids));

  const lessonsFile = `${COURSES_DIR}/lessons.json`;
  const lessons = await Bun.file(lessonsFile).json();
  let publishedLessons = 0;
  for (const l of lessons) {
    if (newLessonIds.has(l.uuid)) {
      l.status = 'published';
      l.updatedAt = now;
      publishedLessons++;
    }
  }
  await Bun.write(lessonsFile, JSON.stringify(lessons, null, 2));

  const stepsFile = `${COURSES_DIR}/steps.json`;
  const steps = await Bun.file(stepsFile).json();
  let publishedSteps = 0;
  for (const s of steps) {
    if (newStepIds.has(s.uuid)) {
      s.status = 'published';
      s.updatedAt = now;
      publishedSteps++;
    }
  }
  await Bun.write(stepsFile, JSON.stringify(steps, null, 2));

  const modulesFile = `${COURSES_DIR}/modules.json`;
  const modules = await Bun.file(modulesFile).json();
  const module = modules.find((m: { title: string }) => m.title === MODULE_TITLE);
  const project = module.projects.find((p: { uuid: string }) => p.uuid === manifest.projectUuid);
  project.status = 'published';
  await Bun.write(modulesFile, JSON.stringify(modules, null, 2));

  console.log(
    `✅ Публикация: проект + ${publishedLessons} уроков + ${publishedSteps} шагов → published`,
  );
}

async function archiveOldProjects(): Promise<void> {
  const modulesFile = `${COURSES_DIR}/modules.json`;
  const modules = await Bun.file(modulesFile).json();
  const module = modules.find((m: { title: string }) => m.title === MODULE_TITLE);
  let count = 0;
  for (const p of module.projects) {
    // Архивируем всё, кроме новых проектов (их uuid — в манифестах data/backup)
    const isRedesign = (await manifestUuids()).has(p.uuid);
    if (!isRedesign && p.status === 'published') {
      p.status = 'archived';
      count++;
      console.log(`   📦 archived: ${p.title}`);
    }
  }
  await Bun.write(modulesFile, JSON.stringify(modules, null, 2));
  console.log(`✅ Архивировано проектов: ${count}`);
}

/** uuid новых проектов из манифестов (если манифеста нет — проект ещё не уложен) */
async function manifestUuids(): Promise<Set<string>> {
  const uuids = new Set<string>();
  try {
    const files = Array.from(
      new Bun.Glob('redesign-manifest-*.json').scanSync({ cwd: 'data/backup' }),
    );
    for (const f of files) {
      const text = await Bun.file(`data/backup/${f}`).text();
      const m = JSON.parse(text);
      if (m.projectUuid) uuids.add(m.projectUuid as string);
    }
  } catch {
    // манифестов ещё нет
  }
  return uuids;
}

// ─── Основной сценарий ──────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const archiveMode = args.includes('--archive-old');
  const apply = args.includes('--apply');
  const dir = args.find((a) => !a.startsWith('--'));

  if (archiveMode) {
    await archiveOldProjects();
    return;
  }
  if (!dir) {
    console.error('Использование: deliver-redesign.ts <dir> [--apply] | --archive-old');
    process.exit(1);
  }

  const metaFile = Bun.file(`${dir}/project.json`);
  if (!(await metaFile.exists())) throw new Error(`Не найден ${dir}/project.json`);
  const meta = await metaFile.json();

  // Парсинг уроков (порядок уроков — числовой по номеру в имени папки pN-lM-…)
  const glob = new Bun.Glob('p*-l*/');
  const lessonDirs: string[] = [];
  for await (const d of glob.scan({ cwd: dir, onlyFiles: false })) {
    lessonDirs.push(d.replace(/\/$/, ''));
  }
  lessonDirs.sort((a, b) => {
    const la = Number(a.match(/-l(\d+)/)?.[1] ?? 0);
    const lb = Number(b.match(/-l(\d+)/)?.[1] ?? 0);
    return la - lb;
  });
  console.log(`📚 ${dir}: ${lessonDirs.length} уроков`);

  const parsed: ParsedLesson[] = [];
  for (const ld of lessonDirs) {
    const md = await Bun.file(`${dir}/${ld}/lesson.md`).text();
    parsed.push(parseLessonMd(ld, md));
  }

  // Dry-run: показать план
  let totalSteps = 0;
  for (const l of parsed) {
    totalSteps += l.steps.length;
    console.log(
      `   • ${l.title} — ${l.steps.length} шагов, ~${l.estimatedMinutes ?? '?'} мин`,
    );
  }
  console.log(`Проект: «${meta.title}» — итого ${totalSteps} шагов`);

  if (!apply) {
    console.log('🔍 Dry-run. Для записи добавь --apply');
    return;
  }

  // Боевой прогон через UC: add-project → create-lesson → create-step
  // (роль AUTHOR у Нурболата — теперь UC-политики проходят).
  // Публикация — прямой правкой статуса по манифесту (publish-UC нет).
  console.log('\n🚀 Применяю через UC...');
  const app = createApp(true);

  const modules = await app.execute('list-modules', {});
  const algoritms = modules.find((m: { title: string }) => m.title === MODULE_TITLE);
  if (!algoritms) throw new Error(`Модуль «${MODULE_TITLE}» не найден`);

  const modulesFile = `${COURSES_DIR}/modules.json`;
  const modulesRaw = await Bun.file(modulesFile).json();
  const moduleRaw = modulesRaw.find((m: { title: string }) => m.title === MODULE_TITLE);
  let projectUuid = moduleRaw.projects.find(
    (p: { title: string; status: string }) => p.title === meta.title,
  )?.uuid;
  if (projectUuid) {
    console.log(`📦 Проект уже существует, переиспользую: ${projectUuid}`);
  } else {
    const project = await app.execute(
      'add-project',
      { moduleId: algoritms.uuid, ...meta },
      NUR_UUID,
    );
    projectUuid = project.projects[project.projects.length - 1].uuid;
    console.log(`📦 Проект создан: ${projectUuid} «${meta.title}»`);
  }

  const manifest: Manifest = { dir, projectUuid, lessons: [] };

  for (const l of parsed) {
    const lesson = await app.execute(
      'create-lesson',
      {
        moduleId: algoritms.uuid,
        projectId: projectUuid,
        title: l.title,
        additional: l.additional,
        estimatedMinutes: l.estimatedMinutes,
      },
      NUR_UUID,
    );
    const stepUuids: string[] = [];
    for (const s of l.steps) {
      const step = await app.execute(
        'create-step',
        {
          moduleId: algoritms.uuid,
          lessonId: lesson.uuid,
          description: s.description,
          kind: 'text',
          content: s.content,
        },
        NUR_UUID,
      );
      stepUuids.push(step.uuid);
    }
    manifest.lessons.push({
      dir: l.dir,
      lessonUuid: lesson.uuid,
      title: l.title,
      stepUuids,
    });
    console.log(`   ✅ ${l.title}: ${stepUuids.length} шагов (${lesson.uuid})`);
  }

  const manifestPath = `data/backup/redesign-manifest-${dir}.json`;
  await Bun.write(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\n📝 Манифест: ${manifestPath}`);

  await publish(manifest);
}

main().catch((err) => {
  console.error('❌ Ошибка:', err.message || err);
  process.exit(1);
});
