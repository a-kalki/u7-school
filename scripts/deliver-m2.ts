/**
 * deliver-m2.ts — укладка md-исходников «Алгоритмики» (m2) в БД.
 *
 * ## Назначение
 * Читает сгенерированные md-уроки из `data/fullstack-js/m2-algorithm`
 * и переносит их в `data/courses/*.json` двумя способами:
 *   - `--create pN,…` — создаёт НОВЫЕ проекты (П6–П8) через боевые UC:
 *     `add-project` → `create-lesson` → `create-step`, затем публикация
 *     прямой правкой JSON по манифесту (publish-UC для контента нет);
 *   - `--update pN,…` — обновляет СУЩЕСТВУЮЩИЕ проекты (П9–П14) прямой
 *     правкой JSON по маппингу старых uuid (create/update-UC нет).
 *
 * ## Использование
 *   bun run scripts/deliver-m2.ts --create p6            # dry-run
 *   bun run scripts/deliver-m2.ts --update p9             # dry-run: список diff
 *   bun run scripts/deliver-m2.ts --check p9              # сверка md ↔ json
 *   bun run scripts/deliver-m2.ts --update p9 --apply     # запись
 *
 * ## Перед --apply
 *   1. `bun run backup` — бэкап данных;
 *   2. остановить бота (он пишет в те же JSON): `bun run start:prod:stop`;
 *   3. выполнить `--apply`, проверить, запустить бота обратно.
 *
 * ## Принципы
 *   - Dry-run обязателен перед записью (по умолчанию — чтение).
 *   - Обновление — только по uuid, без изменения состава связи.
 *   - Число уроков/шагов в md должно совпадать с JSON (иначе — стоп).
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createApp, NUR_UUID, resolveActor } from './_app-factory';

const COURSES_DIR = 'data/courses';
const SRC_DIR = 'data/fullstack-js/m2-algorithm';
const DRAFT_DIR = '/tmp/redesign-m2';
const MODULE_TITLE = 'Алгоритмика';

// новый проект → uuid старого (архивного) проекта в БД; для П9–П14
const OLD_PROJECT_UUID: Record<number, string> = {
  9: '0452b677-851a-432f-930d-6032a552530d',
  10: 'c92bf9c2-bb40-4c99-b85f-d44f8c462abc',
  11: '4da5dc6c-9ce0-4039-8f25-7511bd66db09',
  12: '7af9f0e5-dd60-45b4-8b9d-1f442488c031',
  13: '1cabe329-a2ec-4acb-a7a6-d83d51493c53',
  14: '8621d5f9-43b2-44cc-a4a8-0c61cb5ae0de',
};

// ─── Типы ───

type StepKind = 'text' | 'code' | 'file';

interface Step {
  name: string;
  kind: StepKind;
  body: string;
}

interface MdLesson {
  dir: string;
  title: string;
  summary: string;
  minutes: number | undefined;
  steps: Step[];
}

interface DbProject {
  uuid: string;
  title: string;
  goal: string;
  result: string;
  additional: string;
  status: string;
  lessonIds: string[];
}

interface DbModule {
  uuid: string;
  title: string;
  status: string;
  projects: DbProject[];
}

interface DbLesson {
  uuid: string;
  moduleId: string;
  title: string;
  additional: string;
  estimatedMinutes?: number;
  status: string;
  updatedAt: string;
  stepIds: string[];
  mentorStepIds: string[];
}

interface DbStep {
  uuid: string;
  moduleId: string;
  description: string;
  content: string;
  kind: StepKind;
  status: string;
  updatedAt: string;
}

// ─── Чтение md ───

function readText(path: string): string {
  return readFileSync(path, 'utf-8');
}

function nowStamp(): string {
  return new Date().toISOString().slice(0, 16);
}

/**
 * `JSON.stringify(…, 2)` разворачивает короткие массивы, а biome их схлопывает —
 * поэтому после записи прогоняем те же файлы через biome, чтобы `bun run lint`
 * оставался зелёным (см. troubleshoot: json-stringify-vs-biome-format).
 */
function formatJsonFiles(files: string[]): void {
  const res = Bun.spawnSync(['bunx', 'biome', 'format', '--write', ...files], {
    stdout: 'pipe',
    stderr: 'pipe',
  });
  if (res.exitCode !== 0) {
    throw new Error(
      `Не удалось отформатировать ${files.join(', ')}: ${res.stderr.toString()}`,
    );
  }
}

/** Папки уроков проекта `pN-…`, отсортированные по номеру урока. */
function lessonDirsFor(p: number): string[] {
  const dir = SRC_DIR;
  if (!existsSync(dir))
    throw new Error(`Нет каталога ${dir}. Сначала генерация.`);
  return readdirSync(dir)
    .filter((d) => new RegExp(`^p${p}-l\\d+-`).test(d))
    .sort((a, b) => {
      const la = Number(a.match(/-l(\d+)-/)?.[1] ?? 0);
      const lb = Number(b.match(/-l(\d+)-/)?.[1] ?? 0);
      return la - lb;
    });
}

/** Паспорт lesson.md: заголовок, «Краткое содержание», «Время». */
function parsePassport(md: string): {
  title: string;
  summary: string;
  minutes: number | undefined;
} {
  const title = md.match(/^# (.+)$/m)?.[1]?.trim() ?? '';
  const sumMatch = md.match(
    /\*\*Краткое содержание:\*\*\s*\n+([\s\S]*?)(?=\n\*\*|\n### |$)/,
  );
  const summary = sumMatch?.[1]?.trim() ?? '';
  const timeRaw = md.match(/\*\*Время:\*\*\s*(.+)/)?.[1] ?? '';
  const minutes = Number.parseInt(timeRaw.match(/(\d+)/)?.[1] ?? '', 10);
  return {
    title,
    summary,
    minutes: Number.isNaN(minutes) ? undefined : minutes,
  };
}

/** Шаги steps.md: заголовок шага = `### Название` + строка `**kind:**`. */
function parseStepsMd(md: string): Step[] {
  const body = md.replace(/^#[^\n]*\n/, '');
  const re = /^###\s+(.+)\n+\*\*kind:\*\*\s*`([^`]+)`[ \t]*$/gm;
  const marks: Array<{
    name: string;
    kind: StepKind;
    headerStart: number;
    bodyStart: number;
  }> = [];
  let m = re.exec(body);
  while (m !== null) {
    const rawKind = m[2] ?? 'text';
    const kind: StepKind =
      rawKind === 'code' || rawKind === 'file' ? rawKind : 'text';
    marks.push({
      name: (m[1] ?? '').trim(),
      kind,
      headerStart: m.index,
      bodyStart: m.index + m[0].length,
    });
    m = re.exec(body);
  }
  const steps: Step[] = [];
  for (let i = 0; i < marks.length; i++) {
    const mark = marks[i];
    if (!mark) continue;
    const next = marks[i + 1];
    const raw = body.slice(
      mark.bodyStart,
      next ? next.headerStart : body.length,
    );
    const text = raw.replace(/\n---\s*$/, '').trim();
    steps.push({ name: mark.name, kind: mark.kind, body: text });
  }
  return steps;
}

function readMdLessons(p: number): MdLesson[] {
  return lessonDirsFor(p).map((dir) => {
    const passport = parsePassport(readText(`${SRC_DIR}/${dir}/lesson.md`));
    const steps = parseStepsMd(readText(`${SRC_DIR}/${dir}/steps.md`));
    return { dir, ...passport, steps };
  });
}

// ─── JSON БД ───

async function readJson<T>(path: string): Promise<T> {
  return Bun.file(path).json() as Promise<T>;
}

interface Db {
  modules: DbModule[];
  lessons: DbLesson[];
  steps: DbStep[];
  mod: DbModule;
}

async function loadDb(): Promise<Db> {
  const modules = await readJson<DbModule[]>(`${COURSES_DIR}/modules.json`);
  const lessons = await readJson<DbLesson[]>(`${COURSES_DIR}/lessons.json`);
  const steps = await readJson<DbStep[]>(`${COURSES_DIR}/steps.json`);
  const mod = modules.find((m) => m.title === MODULE_TITLE);
  if (!mod) throw new Error(`В БД нет модуля «${MODULE_TITLE}»`);
  return { modules, lessons, steps, mod };
}

async function writeDb(db: Db): Promise<void> {
  writeFileSync(
    `${COURSES_DIR}/modules.json`,
    `${JSON.stringify(db.modules, null, 2)}\n`,
  );
  writeFileSync(
    `${COURSES_DIR}/lessons.json`,
    `${JSON.stringify(db.lessons, null, 2)}\n`,
  );
  writeFileSync(
    `${COURSES_DIR}/steps.json`,
    `${JSON.stringify(db.steps, null, 2)}\n`,
  );
  formatJsonFiles([
    `${COURSES_DIR}/modules.json`,
    `${COURSES_DIR}/lessons.json`,
    `${COURSES_DIR}/steps.json`,
  ]);
}

/** uuid проекта в БД: для П1–П5 — по названию черновика, для П9–П14 — старый uuid. */
function resolveProjectUuid(p: number, db: Db): string {
  if (p >= 9) {
    const uuid = OLD_PROJECT_UUID[p];
    if (!uuid) throw new Error(`Нет старого uuid для П${p}`);
    return uuid;
  }
  const metaPath = `${DRAFT_DIR}/redesign-p${p}/project.json`;
  if (!existsSync(metaPath)) throw new Error(`Нет ${metaPath}`);
  const meta = JSON.parse(readText(metaPath)) as { title: string };
  const proj = db.mod.projects.find(
    (x) => x.title === meta.title && x.status === 'published',
  );
  if (!proj) throw new Error(`В БД нет published-проекта «${meta.title}»`);
  return proj.uuid;
}

// ─── Dry-run отчёты ───

function reportCheck(p: number, db: Db): boolean {
  const projUuid = resolveProjectUuid(p, db);
  const proj = db.mod.projects.find((x) => x.uuid === projUuid);
  if (!proj) throw new Error(`В БД нет проекта ${projUuid}`);
  const mdLessons = readMdLessons(p);
  if (mdLessons.length !== proj.lessonIds.length) {
    console.error(
      `❌ П${p}: уроков md=${mdLessons.length}, json=${proj.lessonIds.length}`,
    );
    return false;
  }
  let ok = true;
  mdLessons.forEach((mdLesson, li) => {
    const dbLesson = db.lessons.find((l) => l.uuid === proj.lessonIds[li]);
    if (!dbLesson) {
      console.error(`❌ П${p}: нет урока ${proj.lessonIds[li]}`);
      ok = false;
      return;
    }
    if (mdLesson.steps.length !== dbLesson.stepIds.length) {
      console.error(
        `❌ П${p}-l${li + 1}: шагов md=${mdLesson.steps.length}, json=${dbLesson.stepIds.length}`,
      );
      ok = false;
    }
    mdLesson.steps.forEach((s, si) => {
      const dbStep = db.steps.find((x) => x.uuid === dbLesson.stepIds[si]);
      if (!dbStep) {
        console.error(`❌ П${p}-l${li + 1}: нет шага ${dbLesson.stepIds[si]}`);
        ok = false;
        return;
      }
      if (dbStep.description !== s.name || dbStep.content !== s.body) {
        console.error(
          `✏️  П${p}-l${li + 1} шаг ${si + 1}: md ≠ json («${s.name}»)`,
        );
        ok = false;
      }
    });
  });
  return ok;
}

async function runCreate(projects: number[], apply: boolean): Promise<void> {
  const db = await loadDb();
  const app = createApp(true);
  const modules = (await app.execute('list-modules', {})) as Array<{
    uuid: string;
    title: string;
  }>;
  const modMeta = modules.find((m) => m.title === MODULE_TITLE);
  if (!modMeta) throw new Error(`В API нет модуля «${MODULE_TITLE}»`);
  const actor = await resolveActor(app, NUR_UUID);

  for (const p of projects) {
    if (p < 6 || p > 8) throw new Error(`--create поддерживает только П6–П8`);
    const metaPath = `${DRAFT_DIR}/redesign-p${p}/project.json`;
    if (!existsSync(metaPath)) throw new Error(`Нет ${metaPath}`);
    const meta = JSON.parse(readText(metaPath)) as {
      title: string;
      goal: string;
      result: string;
      additional: string;
    };
    const mdLessons = readMdLessons(p);
    const stepCount = mdLessons.reduce((n, l) => n + l.steps.length, 0);
    console.log(
      `\n📚 create П${p} «${meta.title}» — ${mdLessons.length} уроков / ${stepCount} шагов`,
    );
    for (const l of mdLessons) {
      console.log(`   • ${l.title} — ${l.steps.length} шагов`);
    }
    if (!apply) continue;

    const existing = db.mod.projects.find((x) => x.title === meta.title);
    if (existing)
      throw new Error(`Проект «${meta.title}» уже есть: ${existing.uuid}`);
    const created = (await app.execute(
      'add-project',
      { moduleId: modMeta.uuid, ...meta },
      actor,
    )) as { projects: DbProject[] };
    const project = created.projects.at(-1);
    if (!project) throw new Error('add-project не вернул проект');
    console.log(`   📦 проект: ${project.uuid}`);

    const manifest = { p, projectUuid: project.uuid, lessons: [] as unknown[] };
    for (const l of mdLessons) {
      const lesson = (await app.execute(
        'create-lesson',
        {
          moduleId: modMeta.uuid,
          projectId: project.uuid,
          title: l.title,
          additional: l.summary,
          estimatedMinutes: l.minutes,
        },
        actor,
      )) as { uuid: string };
      const stepUuids: string[] = [];
      for (const s of l.steps) {
        const step = (await app.execute(
          'create-step',
          {
            moduleId: modMeta.uuid,
            lessonId: lesson.uuid,
            description: s.name,
            kind: s.kind,
            content: s.body,
          },
          actor,
        )) as { uuid: string };
        stepUuids.push(step.uuid);
      }
      manifest.lessons.push({
        dir: l.dir,
        lessonUuid: lesson.uuid,
        title: l.title,
        stepUuids,
      });
      console.log(`   ✅ ${l.title}: ${stepUuids.length} шагов`);
    }
    const manifestPath = `data/backup/deliver-m2-manifest-p${p}.json`;
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    console.log(`   📝 манифест: ${manifestPath}`);

    // create-UC создаёт сущности в статусе draft — публикуем прямой правкой JSON
    await publishCreated(
      project.uuid,
      manifest.lessons as Array<{ lessonUuid: string; stepUuids: string[] }>,
    );
  }
  if (!apply) console.log('\n🔍 Dry-run. Для записи добавь --apply');
}

/** Публикация только что созданных проекта/уроков/шагов (draft → published). */
async function publishCreated(
  projectUuid: string,
  lessons: Array<{ lessonUuid: string; stepUuids: string[] }>,
): Promise<void> {
  const modules = await readJson<DbModule[]>(`${COURSES_DIR}/modules.json`);
  const dbLessons = await readJson<DbLesson[]>(`${COURSES_DIR}/lessons.json`);
  const dbSteps = await readJson<DbStep[]>(`${COURSES_DIR}/steps.json`);
  const now = nowStamp();
  let publishedLessons = 0;
  let publishedSteps = 0;
  for (const l of lessons) {
    const dl = dbLessons.find((x) => x.uuid === l.lessonUuid);
    if (dl) {
      dl.status = 'published';
      dl.updatedAt = now;
      publishedLessons++;
    }
    for (const sid of l.stepUuids) {
      const ds = dbSteps.find((x) => x.uuid === sid);
      if (ds) {
        ds.status = 'published';
        ds.updatedAt = now;
        publishedSteps++;
      }
    }
  }
  const mod = modules.find((m) => m.title === MODULE_TITLE);
  const proj = mod?.projects.find((x) => x.uuid === projectUuid);
  if (!proj) throw new Error(`Не найден созданный проект ${projectUuid}`);
  proj.status = 'published';
  writeFileSync(
    `${COURSES_DIR}/modules.json`,
    `${JSON.stringify(modules, null, 2)}\n`,
  );
  writeFileSync(
    `${COURSES_DIR}/lessons.json`,
    `${JSON.stringify(dbLessons, null, 2)}\n`,
  );
  writeFileSync(
    `${COURSES_DIR}/steps.json`,
    `${JSON.stringify(dbSteps, null, 2)}\n`,
  );
  formatJsonFiles([
    `${COURSES_DIR}/modules.json`,
    `${COURSES_DIR}/lessons.json`,
    `${COURSES_DIR}/steps.json`,
  ]);
  console.log(
    `   ✅ опубликовано: проект + ${publishedLessons} уроков + ${publishedSteps} шагов`,
  );
}

async function runUpdate(projects: number[], apply: boolean): Promise<void> {
  const db = await loadDb();
  const now = nowStamp();
  let changedLessons = 0;
  let changedSteps = 0;

  for (const p of projects) {
    const projUuid = OLD_PROJECT_UUID[p];
    if (!projUuid) throw new Error(`--update поддерживает только П9–П14`);
    const proj = db.mod.projects.find((x) => x.uuid === projUuid);
    if (!proj) throw new Error(`В БД нет проекта ${projUuid}`);
    const mdLessons = readMdLessons(p);
    if (mdLessons.length !== proj.lessonIds.length) {
      throw new Error(
        `П${p}: уроков md=${mdLessons.length}, json=${proj.lessonIds.length}`,
      );
    }
    console.log(
      `\n📚 update П${p} «${proj.title}» [${proj.status}] — ${mdLessons.length} уроков`,
    );
    mdLessons.forEach((mdLesson, li) => {
      const dbLesson = db.lessons.find((l) => l.uuid === proj.lessonIds[li]);
      if (!dbLesson) throw new Error(`Нет урока ${proj.lessonIds[li]}`);
      if (mdLesson.steps.length !== dbLesson.stepIds.length) {
        throw new Error(
          `П${p}-l${li + 1}: шагов md=${mdLesson.steps.length}, json=${dbLesson.stepIds.length}`,
        );
      }
      const lessonChanged =
        dbLesson.title !== mdLesson.title ||
        dbLesson.additional !== mdLesson.summary ||
        dbLesson.estimatedMinutes !== mdLesson.minutes ||
        dbLesson.status !== 'published';
      if (lessonChanged) {
        changedLessons++;
        console.log(`   ✏️  L${li + 1}: ${mdLesson.title}`);
      }
      if (apply) {
        dbLesson.title = mdLesson.title;
        dbLesson.additional = mdLesson.summary;
        dbLesson.estimatedMinutes = mdLesson.minutes;
        dbLesson.status = 'published';
        dbLesson.updatedAt = now;
      }
      mdLesson.steps.forEach((s, si) => {
        const dbStep = db.steps.find((x) => x.uuid === dbLesson.stepIds[si]);
        if (!dbStep) throw new Error(`Нет шага ${dbLesson.stepIds[si]}`);
        const stepChanged =
          dbStep.description !== s.name ||
          dbStep.content !== s.body ||
          dbStep.kind !== s.kind ||
          dbStep.status !== 'published';
        if (stepChanged) changedSteps++;
        if (apply) {
          dbStep.description = s.name;
          dbStep.content = s.body;
          dbStep.kind = s.kind;
          dbStep.status = 'published';
          dbStep.updatedAt = now;
        }
      });
    });
    if (apply) {
      proj.status = 'published';
    }
  }

  if (apply) {
    await writeDb(db);
    console.log(
      `\n✅ Записано: уроков изменено ${changedLessons}, шагов изменено ${changedSteps}`,
    );
  } else {
    console.log(
      `\n🔍 Dry-run: будет изменено уроков ${changedLessons}, шагов ${changedSteps}. Для записи добавь --apply`,
    );
  }
}

// ─── CLI ───

function parseProjects(args: string[], flag: string): number[] {
  const i = args.indexOf(flag);
  if (i < 0) return [];
  const raw = args[i + 1];
  if (!raw || raw.startsWith('--')) {
    console.error(`❌ ${flag} требует список проектов, например p9,p10`);
    process.exit(1);
  }
  return raw
    .split(',')
    .map((s) => Number.parseInt(s.replace(/^p/i, ''), 10))
    .filter((n) => !Number.isNaN(n));
}

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply');
  const create = parseProjects(args, '--create');
  const update = parseProjects(args, '--update');
  const check = parseProjects(args, '--check');

  if (create.length === 0 && update.length === 0 && check.length === 0) {
    console.error(
      'Использование: deliver-m2.ts (--create | --update | --check) pN[,pN] [--apply]',
    );
    process.exit(1);
  }

  if (check.length) {
    const db = await loadDb();
    let allOk = true;
    for (const p of check) allOk = reportCheck(p, db) && allOk;
    console.log(
      allOk
        ? '\n✅ Сверка md ↔ json: расхождений нет'
        : '\n❌ Есть расхождения',
    );
    if (!allOk) process.exit(2);
  }
  if (create.length) await runCreate(create, apply);
  if (update.length) await runUpdate(update, apply);
}

main().catch((err) => {
  console.error('❌ Ошибка:', err?.message || err);
  process.exit(1);
});
