/**
 * list-lessons.ts — выводит список проектов, уроков и количество шагов.
 *
 * Использование:
 *   bun run scripts/list-lessons.ts             # все проекты
 *   bun run scripts/list-lessons.ts 2           # только проект 2
 */

import { readFileSync, existsSync, readdirSync } from 'node:fs';

interface LessonEntry {
  uuid: string;
  title: string;
  stepIds: string[];
  mentorStepIds: string[];
}

interface ModuleProject {
  uuid: string;
  title: string;
  lessonIds: string[];
}

interface ModuleData {
  uuid: string;
  title: string;
  projects: ModuleProject[];
}

interface ManifestFile {
  lessonUuid?: string;
  files: unknown[];
}

const mod = JSON.parse(readFileSync('data/courses/modules.json', 'utf-8')).find(
  (m: ModuleData) => m.uuid === 'e4dea4fc-f8db-4b19-be2d-59fcf3ad96fa',
);

const lessons: LessonEntry[] = JSON.parse(readFileSync('data/courses/lessons.json', 'utf-8'));

const lessonByUuid: Record<string, LessonEntry> = {};
for (const l of lessons) lessonByUuid[l.uuid] = l;

// Сканируем папки для поиска mentor-файлов
const dirs = readdirSync('data/lessons/nur').filter(d => /^p\d+-l\d+-/.test(d));

function countMentorFiles(pNlM: string): number {
  const dir = dirs.find(d => d.startsWith(pNlM + '-'));
  if (!dir) return 0;
  const path = `data/lessons/nur/${dir}/mentor-files/manifest.json`;
  if (!existsSync(path)) return 0;
  try {
    const raw = JSON.parse(readFileSync(path, 'utf-8'));
    const files = Array.isArray(raw) ? raw : (raw as ManifestFile).files ?? [];
    return files.length;
  } catch {
    return 0;
  }
}

function main() {
  const args = process.argv.slice(2);
  const filterProject = args[0] ? parseInt(args[0], 10) : undefined;

  for (let pi = 0; pi < mod.projects.length; pi++) {
    const project = mod.projects[pi];
    const N = pi + 1;

    if (filterProject !== undefined && filterProject !== N) continue;

    console.log(`\n📦 Проект ${N}: ${project.title} (${project.lessonIds.length} уроков)`);

    for (let li = 0; li < project.lessonIds.length; li++) {
      const uuid = project.lessonIds[li];
      const M = li + 1;
      const lessonId = `p${N}-l${M}`;
      const lesson = lessonByUuid[uuid];

      const steps = lesson?.stepIds?.length ?? 0;
      const mentorSteps = lesson?.mentorStepIds?.length ?? 0;
      const mentorFiles = countMentorFiles(lessonId);

      const parts: string[] = [];
      if (steps) parts.push(`📝 ${steps}`);
      if (mentorSteps) parts.push(`👤 ${mentorSteps}`);
      if (mentorFiles) parts.push(`📁 ${mentorFiles}`);

      console.log(`  ${lessonId} ${lesson?.title ?? '—'}`);
      if (parts.length) console.log(`       шаги: ${parts.join(', ')}`);
    }
  }

  console.log();
}

main();
