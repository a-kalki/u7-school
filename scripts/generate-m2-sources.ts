/**
 * generate-m2-sources.ts — генерация md-исходников модуля «Алгоритмика» (m2).
 *
 * ## Назначение
 * Приводит `data/fullstack-js/m2-algorithm` в соответствие новому плану
 * (П1–П14). Для каждого урока формирует три файла целевого формата:
 *   - `lesson.md` — паспорт (заголовок, Краткое содержание, Время,
 *     Основные темы, Термины, Источники) + конспект (если был в источнике);
 *   - `steps.md` — шаги, машиночитаемо (`### Название` + `**kind:**` + тело);
 *   - `summary.md` — краткая выжимка.
 *
 * ## Источники по группам проектов
 *   - П1–П5  — черновики `redesign-p1…p5` (lesson/summary) + json (steps);
 *   - П6–П8  — черновики `redesign-p6…p8` (lesson/summary/steps);
 *   - П9–П14 — старые md `/tmp/m2-algorithm-old/p7…p12` (old = new − 2).
 *
 * ## Использование
 *   bun run scripts/generate-m2-sources.ts                 # dry-run, все проекты
 *   bun run scripts/generate-m2-sources.ts --only p1       # только один проект
 *   bun run scripts/generate-m2-sources.ts --only p1,p2    # список проектов
 *   bun run scripts/generate-m2-sources.ts --apply         # запись в дерево
 *
 * ## Принципы
 *   - Идемпотентность: повторный запуск даёт тот же результат.
 *   - Dry-run обязателен перед записью (по умолчанию — чтение).
 *   - steps.md для П1–П5 точно повторяет json (истина — БД).
 */
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';

const COURSES_DIR = 'data/courses';
const OUT_DIR = 'data/fullstack-js/m2-algorithm';
const DRAFT_DIR = '/tmp/redesign-m2';
const OLD_DIR = '/tmp/m2-algorithm-old';
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

interface Step {
  name: string;
  kind: string;
  body: string;
}

interface Lesson {
  key: string; // "p1-l1" (новый номер)
  dirName: string; // "p1-l1-what-is-git"
  title: string;
  summary: string; // текст «Краткое содержание»
  minutes: number | undefined;
  timeLine: string | undefined; // готовая строка времени из черновика
  topics: string[]; // строки основных тем
  steps: Step[];
  summaryMd: string; // исходный summary.md (или построенный)
  extraMd: string; // конспект из старого lesson.md (если есть)
}

type Group = 'draft-json' | 'draft' | 'old';

interface Job {
  group: Group;
  newP: number;
  sourceDir: string; // папка проекта-источника
  jsonProjectUuid?: string;
}

// ─── Утилиты ───

function readText(path: string): string {
  return readFileSync(path, 'utf-8');
}

async function readJson<T>(path: string): Promise<T> {
  return Bun.file(path).json() as Promise<T>;
}

/** Сортировка папок уроков по номеру урока (pN-l2 < pN-l10). */
function listLessonDirs(dir: string): string[] {
  return readdirSync(dir)
    .filter((d) => /^p\d+-l\d+-/.test(d))
    .sort((a, b) => {
      const la = Number(a.match(/-l(\d+)-/)?.[1] ?? 0);
      const lb = Number(b.match(/-l(\d+)-/)?.[1] ?? 0);
      return la - lb;
    });
}

function kebabOfDir(dirName: string): string {
  return dirName.replace(/^p\d+-l\d+-/, '');
}

/** Нормализация заголовка проекта: без хвостового уточнения в скобках. */
function normTitle(title: string): string {
  return title.replace(/\s*\([^)]*\)\s*$/, '').trim();
}

// ─── Парсинг черновика (redesign-p1…p8) ───

interface ParsedDraft {
  title: string;
  timeLine: string | undefined;
  summary: string;
  topics: string[];
  steps: Step[];
}

function parseDraftLesson(md: string): ParsedDraft {
  const title = md.match(/^# (.+)$/m)?.[1]?.trim() ?? '';

  const timeLine = md.match(/\*\*Время:\*\*\s*(.+)/)?.[1]?.trim();

  // Краткое содержание — абзац до следующего блока `**…**`/заголовка
  const sumMatch = md.match(
    /\*\*Краткое содержание:\*\*\s*\n+([\s\S]*?)(?=\n\*\*|\n### |\n---\s*\n### |$)/,
  );
  const summary = sumMatch?.[1]?.trim() ?? '';

  // Основные темы — список до `---`/`###`
  const topicsMatch = md.match(
    /\*\*Основные темы:\*\*\s*\n+([\s\S]*?)(?=\n---|\n### |$)/,
  );
  const topics = (topicsMatch?.[1] ?? '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  return { title, timeLine, summary, topics, steps: parseDraftSteps(md) };
}

/** Шаги черновика: `#### Шаг N. Название` + тело до следующего шага. */
function parseDraftSteps(md: string): Step[] {
  const marker = md.indexOf('### Шаги урока');
  const scope = marker >= 0 ? md.slice(marker) : md;
  const regex = /^#### Шаг \d+\.\s*(.+)$/gm;
  const marks: Array<{ name: string; bodyStart: number }> = [];
  let m = regex.exec(scope);
  while (m !== null) {
    marks.push({ name: (m[1] ?? '').trim(), bodyStart: m.index + m[0].length });
    m = regex.exec(scope);
  }
  const steps: Step[] = [];
  for (let i = 0; i < marks.length; i++) {
    const mark = marks[i];
    if (!mark) continue;
    const next = marks[i + 1];
    const rawEnd = next
      ? scope.lastIndexOf('\n#### Шаг', next.bodyStart) + 1
      : scope.length;
    let body = scope.slice(mark.bodyStart, rawEnd);
    body = body.replace(/\n---\s*$/g, '').trim();
    steps.push({ name: mark.name, kind: 'text', body });
  }
  return steps;
}

// ─── Парсинг старых md (m2-algorithm-old) ───

interface ParsedOld {
  title: string;
  summary: string;
  extraMd: string;
}

function parseOldLesson(md: string): ParsedOld {
  const title = md.match(/^# (.+)$/m)?.[1]?.trim() ?? '';
  const sumMatch = md.match(
    /\*\*Краткое содержание:\*\*\s*\n+([\s\S]*?)(?=\n### |\n\*\*[А-ЯA-Za-z]|\n---|\n\*\*Видео|$)/,
  );
  const summary = sumMatch?.[1]?.trim() ?? '';
  // Конспект — всё после абзаца «Краткое содержание»
  const restStart = sumMatch ? (sumMatch.index ?? 0) + sumMatch[0].length : 0;
  const extraMd = md
    .slice(restStart)
    .replace(/^\s*\n+/, '')
    .trim();
  return { title, summary, extraMd };
}

/** Шаги старого steps.md: блоки через `---`, `### Название`, `**kind:**`. */
function parseOldSteps(md: string): Step[] {
  const body = md.replace(/^#[^\n]*\n/, '');
  const re = /^###\s+(.+)\n+\*\*kind:\*\*\s*`([^`]+)`[ \t]*$/gm;
  const marks: Array<{
    name: string;
    kind: string;
    headerStart: number;
    bodyStart: number;
  }> = [];
  let m = re.exec(body);
  while (m !== null) {
    marks.push({
      name: (m[1] ?? '').trim(),
      kind: m[2] ?? 'text',
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

// ─── Извлечение терминов и источников ───

/** Собирает блоки `**Термины:**` из тел шагов в единый список. */
function collectTerms(steps: Step[]): string {
  const items: string[] = [];
  for (const s of steps) {
    const tm = s.body.match(/\*\*Термины:\*\*\s*\n([\s\S]*?)(?:\n\s*\n|$)/);
    if (!tm) continue;
    const block = (tm[1] ?? '')
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .join('\n');
    if (block) items.push(block);
  }
  return items.join('\n');
}

/** Собирает внешние markdown-ссылки из тел шагов (уникальные, по порядку). */
function collectSources(steps: Step[], extraMd = ''): string[] {
  const all = `${steps.map((s) => s.body).join('\n')}\n${extraMd}`;
  const seen = new Set<string>();
  const out: string[] = [];
  const regex = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;
  let m = regex.exec(all);
  while (m !== null) {
    const url = m[2] ?? '';
    if (url && !seen.has(url)) {
      seen.add(url);
      out.push(`- [${m[1]}](${url})`);
    }
    m = regex.exec(all);
  }
  return out;
}

// ─── Рендер целевых файлов ───

function renderStepsMd(title: string, steps: Step[]): string {
  const blocks = steps.map((s) => {
    const kind = s.kind || 'text';
    return `### ${s.name}\n\n**kind:** \`${kind}\`\n\n${s.body}`;
  });
  return `# Шаги урока: ${title}\n\n---\n\n${blocks.join('\n\n---\n\n')}\n`;
}

function renderLessonMd(lesson: Lesson): string {
  const parts: string[] = [`# ${lesson.title}`];

  if (lesson.summary) {
    parts.push(`**Краткое содержание:**\n${lesson.summary}`);
  }

  const time = lesson.timeLine
    ? lesson.timeLine
    : lesson.minutes
      ? `~${lesson.minutes} мин`
      : undefined;
  if (time) parts.push(`**Время:** ${time}`);

  const topics = lesson.topics.filter(Boolean);
  if (topics.length) {
    parts.push(`**Основные темы:**\n${topics.join('\n')}`);
  }

  const terms = collectTerms(lesson.steps);
  if (terms) parts.push(`**Термины:**\n${terms}`);

  const sources = collectSources(lesson.steps, lesson.extraMd);
  if (sources.length) parts.push(`### Источники\n\n${sources.join('\n')}`);

  if (lesson.extraMd) parts.push(lesson.extraMd);

  return `${parts.join('\n\n')}\n`;
}

// ─── Сборка уроков по группам ───

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
  title: string;
  additional: string;
  estimatedMinutes?: number;
  stepIds: string[];
}

interface DbStep {
  uuid: string;
  description: string;
  content: string;
  kind: string;
}

async function loadDb(): Promise<{
  lessons: DbLesson[];
  steps: DbStep[];
  mod: DbModule;
}> {
  const modules = await readJson<DbModule[]>(`${COURSES_DIR}/modules.json`);
  const lessons = await readJson<DbLesson[]>(`${COURSES_DIR}/lessons.json`);
  const steps = await readJson<DbStep[]>(`${COURSES_DIR}/steps.json`);
  const mod = modules.find((m) => m.title === MODULE_TITLE);
  if (!mod) throw new Error(`В БД нет модуля «${MODULE_TITLE}»`);
  return { lessons, steps, mod };
}

async function buildDraftJsonLessons(job: Job): Promise<Lesson[]> {
  const { lessons, steps, mod } = await loadDb();
  const proj = mod.projects.find((p) => p.uuid === job.jsonProjectUuid);
  if (!proj) throw new Error(`В БД нет проекта ${job.jsonProjectUuid}`);
  const dirs = listLessonDirs(job.sourceDir);
  if (dirs.length !== proj.lessonIds.length) {
    throw new Error(
      `${job.sourceDir}: уроков ${dirs.length}, в БД ${proj.lessonIds.length}`,
    );
  }
  return dirs.map((dirName, i) => {
    const dbLesson = lessons.find((l) => l.uuid === proj.lessonIds[i]);
    if (!dbLesson) throw new Error(`В БД нет урока ${proj.lessonIds[i]}`);
    const draft = parseDraftLesson(
      readText(`${job.sourceDir}/${dirName}/lesson.md`),
    );
    const summaryMd = readText(`${job.sourceDir}/${dirName}/summary.md`);
    const dbSteps: Step[] = dbLesson.stepIds.map((sid) => {
      const s = steps.find((x) => x.uuid === sid);
      if (!s) throw new Error(`В БД нет шага ${sid}`);
      return { name: s.description, kind: s.kind, body: s.content };
    });
    return {
      key: `p${job.newP}-l${i + 1}`,
      dirName,
      title: dbLesson.title,
      summary: dbLesson.additional || draft.summary,
      minutes: dbLesson.estimatedMinutes,
      timeLine: draft.timeLine,
      topics: draft.topics,
      steps: dbSteps,
      summaryMd,
      extraMd: '',
    };
  });
}

async function buildDraftLessons(job: Job): Promise<Lesson[]> {
  const dirs = listLessonDirs(job.sourceDir);
  return dirs.map((dirName, i) => {
    const draft = parseDraftLesson(
      readText(`${job.sourceDir}/${dirName}/lesson.md`),
    );
    const summaryMd = readText(`${job.sourceDir}/${dirName}/summary.md`);
    return {
      key: `p${job.newP}-l${i + 1}`,
      dirName,
      title: draft.title,
      summary: draft.summary,
      minutes: undefined,
      timeLine: draft.timeLine,
      topics: draft.topics,
      steps: draft.steps,
      summaryMd,
      extraMd: '',
    };
  });
}

async function buildOldLessons(job: Job): Promise<Lesson[]> {
  const { lessons, mod } = await loadDb();
  const proj = mod.projects.find((p) => p.uuid === job.jsonProjectUuid);
  if (!proj) throw new Error(`В БД нет проекта ${job.jsonProjectUuid}`);
  const oldP = job.newP - 2;
  const dirs = listLessonDirs(job.sourceDir).filter((d) =>
    d.startsWith(`p${oldP}-l`),
  );
  if (dirs.length !== proj.lessonIds.length) {
    throw new Error(
      `${job.sourceDir}: уроков ${dirs.length}, в БД ${proj.lessonIds.length}`,
    );
  }
  return dirs.map((dirName, i) => {
    const dbLesson = lessons.find((l) => l.uuid === proj.lessonIds[i]);
    if (!dbLesson) throw new Error(`В БД нет урока ${proj.lessonIds[i]}`);
    const old = parseOldLesson(
      readText(`${job.sourceDir}/${dirName}/lesson.md`),
    );
    const steps = parseOldSteps(
      readText(`${job.sourceDir}/${dirName}/steps.md`),
    );
    const summaryMd = readText(`${job.sourceDir}/${dirName}/summary.md`);
    const kebab = kebabOfDir(dirName);
    const newName = `p${job.newP}-l${i + 1}-${kebab}`;
    return {
      key: `p${job.newP}-l${i + 1}`,
      dirName: newName,
      title: old.title || dbLesson.title,
      summary: old.summary || dbLesson.additional,
      minutes: dbLesson.estimatedMinutes,
      timeLine: undefined,
      topics: steps.map((s) => s.name).map((n) => `- ${n}`),
      steps,
      summaryMd,
      extraMd: old.extraMd,
    };
  });
}

// ─── Планирование ───

async function buildJobs(): Promise<Job[]> {
  const modules = await readJson<DbModule[]>(`${COURSES_DIR}/modules.json`);
  const mod = modules.find((m) => m.title === MODULE_TITLE);
  if (!mod) throw new Error(`В БД нет модуля «${MODULE_TITLE}»`);
  const published = mod.projects.filter((p) => p.status === 'published');
  const jobs: Job[] = [];

  for (let p = 1; p <= 8; p++) {
    const sourceDir = `${DRAFT_DIR}/redesign-p${p}`;
    if (!existsSync(sourceDir)) throw new Error(`Нет черновика: ${sourceDir}`);
    if (p <= 5) {
      const meta = await readJson<{ title: string }>(
        `${sourceDir}/project.json`,
      );
      const proj = published.find(
        (x) => normTitle(x.title) === normTitle(meta.title),
      );
      if (!proj) throw new Error(`В БД нет published-проекта «${meta.title}»`);
      jobs.push({
        group: 'draft-json',
        newP: p,
        sourceDir,
        jsonProjectUuid: proj.uuid,
      });
    } else {
      jobs.push({ group: 'draft', newP: p, sourceDir });
    }
  }

  for (let p = 9; p <= 14; p++) {
    if (!existsSync(OLD_DIR)) throw new Error(`Нет старой папки: ${OLD_DIR}`);
    const uuid = OLD_PROJECT_UUID[p];
    if (!uuid) throw new Error(`Нет uuid для П${p}`);
    jobs.push({
      group: 'old',
      newP: p,
      sourceDir: OLD_DIR,
      jsonProjectUuid: uuid,
    });
  }

  return jobs;
}

async function lessonsFor(job: Job): Promise<Lesson[]> {
  switch (job.group) {
    case 'draft-json':
      return buildDraftJsonLessons(job);
    case 'draft':
      return buildDraftLessons(job);
    case 'old':
      return buildOldLessons(job);
  }
}

// ─── Основной сценарий ───

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply');
  const onlyArg = args.find((a) => a.startsWith('--only'));
  const only = onlyArg
    ? new Set(
        (onlyArg.includes('=')
          ? (onlyArg.split('=')[1] ?? '')
          : (args[args.indexOf(onlyArg) + 1] ?? '')
        )
          .split(',')
          .map((s) => s.trim().replace(/^p/i, ''))
          .filter(Boolean),
      )
    : null;

  const allJobs = await buildJobs();
  const jobs = only ? allJobs.filter((j) => only.has(String(j.newP))) : allJobs;

  if (jobs.length === 0) {
    console.error('❌ Не выбрано ни одного проекта. Проверь --only.');
    process.exit(1);
  }

  let totalLessons = 0;
  let totalSteps = 0;

  for (const job of jobs) {
    const lessons = await lessonsFor(job);
    console.log(`\n📚 П${job.newP} [${job.group}] — ${lessons.length} уроков`);
    for (const lesson of lessons) {
      totalLessons++;
      totalSteps += lesson.steps.length;
      const target = `${OUT_DIR}/${lesson.dirName}`;
      console.log(
        `   • ${lesson.key} ${lesson.dirName} — ${lesson.steps.length} шагов${
          apply ? ' → записано' : ''
        }`,
      );
      if (apply) {
        mkdirSync(target, { recursive: true });
        writeFileSync(`${target}/lesson.md`, renderLessonMd(lesson));
        writeFileSync(
          `${target}/steps.md`,
          renderStepsMd(lesson.title, lesson.steps),
        );
        writeFileSync(`${target}/summary.md`, lesson.summaryMd);
      }
    }
  }

  console.log(
    `\nИтого: ${jobs.length} проектов, ${totalLessons} уроков, ${totalSteps} шагов`,
  );
  console.log(
    apply ? '✅ Записано в дерево.' : '🔍 Dry-run. Для записи добавь --apply',
  );
}

main().catch((err) => {
  console.error('❌ Ошибка:', err?.message || err);
  process.exit(1);
});
