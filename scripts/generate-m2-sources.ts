/**
 * generate-m2-sources.ts — генерация md-исходников модуля из БД (json).
 *
 * ## Назначение
 * Единственный источник истины — `data/courses/*.json` (модули, уроки, шаги).
 * Скрипт раскладывает контент проекта в папки уроков целевого формата:
 *   - `lesson.md` — паспорт (заголовок, Краткое содержание, Время,
 *     Основные темы, Термины, Источники);
 *   - `steps.md` — шаги (`### Название` + `**kind:**` + тело);
 *   - `summary.md` — краткая выжимка.
 *
 * Никаких внешних источников (/tmp, черновики) и хардкода uuid проектов:
 * всё берётся из json по позиции модуля и проектов.
 *
 * ## Использование
 *   bun run scripts/generate-m2-sources.ts 2                     # dry-run, весь модуль 2
 *   bun run scripts/generate-m2-sources.ts 2 --project 12        # только 12-й проект
 *   bun run scripts/generate-m2-sources.ts 2 --project 12,13     # список
 *   bun run scripts/generate-m2-sources.ts 2 --project 12 --apply
 *
 * Позиция модуля (1-based) совпадает с позицией каталога `data/fullstack-js/m*`
 * (как в `list-lessons.ts`). Позиция проекта — 1-based в `module.projects`.
 */
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';

const COURSES_DIR = 'data/courses';
const DATA_DIR = 'data/fullstack-js';

// ─── Типы ───

interface Step {
  name: string;
  kind: string;
  body: string;
}

interface Lesson {
  title: string;
  summary: string;
  minutes: number | undefined;
  topics: string[];
  steps: Step[];
}

interface DbProject {
  uuid: string;
  title: string;
  status: string;
  lessonIds: string[];
}

interface DbModule {
  uuid: string;
  title: string;
  projects: DbProject[];
}

interface DbLesson {
  uuid: string;
  title: string;
  additional?: string;
  estimatedMinutes?: number;
  stepIds: string[];
}

interface DbStep {
  uuid: string;
  description: string;
  content?: string;
  code?: string;
  language?: string;
  kind?: string;
}

// ─── Утилиты ───

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf-8')) as T;
}

/** Транслитерация + kebab-case — slug для имени папки урока. */
const TRANSLIT: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ё: 'e',
  ж: 'zh',
  з: 'z',
  и: 'i',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'h',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'sch',
  ъ: '',
  ы: 'y',
  ь: '',
  э: 'e',
  ю: 'yu',
  я: 'ya',
};

function slugify(title: string): string {
  const translit = title
    .toLowerCase()
    .split('')
    .map((ch) => TRANSLIT[ch] ?? ch)
    .join('');
  return translit
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '');
}

// ─── Извлечение терминов и источников из шагов ───

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
function collectSources(steps: Step[]): string[] {
  const all = steps.map((s) => s.body).join('\n');
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

  if (lesson.minutes) parts.push(`**Время:** ~${lesson.minutes} мин`);

  const topics = lesson.topics.filter(Boolean);
  if (topics.length) {
    parts.push(`**Основные темы:**\n${topics.join('\n')}`);
  }

  const terms = collectTerms(lesson.steps);
  if (terms) parts.push(`**Термины:**\n${terms}`);

  const sources = collectSources(lesson.steps);
  if (sources.length) parts.push(`### Источники\n\n${sources.join('\n')}`);

  return `${parts.join('\n\n')}\n`;
}

function renderSummaryMd(title: string, summary: string): string {
  const parts: string[] = [`# ${title} — краткая выжимка`];
  if (summary) parts.push(summary);
  parts.push('[Полный конспект](./lesson.md)');
  return `${parts.join('\n\n')}\n`;
}

// ─── Сборка урока из json ───

function buildLesson(
  dbLesson: DbLesson,
  stepsById: Map<string, DbStep>,
): Lesson {
  const steps: Step[] = dbLesson.stepIds
    .map((id) => stepsById.get(id))
    .filter((s): s is DbStep => Boolean(s))
    .map((s) => {
      const lang = s.language || 'javascript';
      const raw =
        s.kind === 'code' && s.code
          ? `**language:** \`${lang}\`\n\n\`\`\`${lang}\n${s.code}\n\`\`\``
          : (s.content ?? '');
      // В json тело шага завершается разделителем `---` — в md его задаёт рендер.
      const body = raw.replace(/\n+-{3,}\s*$/, '').trim();
      return {
        name: s.description,
        kind: s.kind ?? 'text',
        body,
      };
    });

  return {
    title: dbLesson.title,
    summary: dbLesson.additional ?? '',
    minutes: dbLesson.estimatedMinutes,
    topics: steps.map((s) => `- ${s.name}`),
    steps,
  };
}

// ─── CLI ───

function parseProjects(args: string[]): number[] | null {
  const i = args.indexOf('--project');
  if (i < 0) return null;
  const raw = args[i + 1];
  if (!raw || raw.startsWith('--')) {
    console.error('❌ --project требует список, например: 12 или 12,13');
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
  const positional = args.filter((a) => !a.startsWith('--'));
  const modulePos = Number.parseInt(positional[0] ?? '', 10);
  if (Number.isNaN(modulePos)) {
    console.error(
      'Использование: generate-m2-sources.ts <позиция модуля> [--project N[,N]] [--apply]',
    );
    process.exit(1);
  }

  const modules = readJson<DbModule[]>(`${COURSES_DIR}/modules.json`);
  const mod = modules[modulePos - 1];
  if (!mod) throw new Error(`Нет модуля на позиции ${modulePos}`);

  const moduleDirs = readdirSync(DATA_DIR)
    .filter((d) => /^m\d+-/.test(d))
    .sort();
  const moduleDir = moduleDirs[modulePos - 1];
  if (!moduleDir) throw new Error(`Нет каталога для модуля ${modulePos}`);
  const outDir = `${DATA_DIR}/${moduleDir}`;

  const lessons = readJson<DbLesson[]>(`${COURSES_DIR}/lessons.json`);
  const steps = readJson<DbStep[]>(`${COURSES_DIR}/steps.json`);
  const lessonsById = new Map(lessons.map((l) => [l.uuid, l]));
  const stepsById = new Map(steps.map((s) => [s.uuid, s]));

  const only = parseProjects(args);
  const indexes = mod.projects
    .map((_, i) => i)
    .filter((i) => !only || only.includes(i + 1));

  console.log(`📚 Модуль ${modulePos}: ${mod.title} → ${moduleDir}`);
  if (!only) {
    console.log(
      '   ⚠️  --project не указан: будут обработаны все проекты модуля',
    );
  }

  let totalLessons = 0;
  let totalSteps = 0;

  for (const pi of indexes) {
    const project = mod.projects[pi];
    if (!project) continue;
    const dirP = pi + 1;
    console.log(
      `\n📦 p${dirP}: ${project.title} [${project.status}] — ${project.lessonIds.length} уроков`,
    );

    project.lessonIds.forEach((lessonId, li) => {
      const dbLesson = lessonsById.get(lessonId);
      if (!dbLesson) throw new Error(`Нет урока ${lessonId}`);
      const lesson = buildLesson(dbLesson, stepsById);
      totalLessons++;
      totalSteps += lesson.steps.length;

      const slug = slugify(lesson.title);
      const dirName = `p${dirP}-l${li + 1}-${slug}`;
      const target = `${outDir}/${dirName}`;
      console.log(`   • ${dirName} — ${lesson.steps.length} шагов`);

      if (apply) {
        mkdirSync(target, { recursive: true });
        writeFileSync(`${target}/lesson.md`, renderLessonMd(lesson));
        writeFileSync(
          `${target}/steps.md`,
          renderStepsMd(lesson.title, lesson.steps),
        );
        writeFileSync(
          `${target}/summary.md`,
          renderSummaryMd(lesson.title, lesson.summary),
        );
      }
    });
  }

  console.log(
    `\nИтого: ${indexes.length} проектов, ${totalLessons} уроков, ${totalSteps} шагов`,
  );
  console.log(
    apply ? '✅ Записано в дерево.' : '🔍 Dry-run. Для записи добавь --apply',
  );
}

main().catch((err) => {
  console.error('❌ Ошибка:', err?.message || err);
  process.exit(1);
});
