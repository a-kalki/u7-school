/**
 * import-p3-steps.ts — импорт студенческих шагов p3 напрямую в JSON-файлы БД.
 *
 * Использование:
 *   bun run scripts/import-p3-steps.ts
 */

import { readFileSync, writeFileSync } from 'node:fs';

const PROPOSED_FILE = 'proposed-steps-p3.json';
const STEPS_FILE = 'data/courses/steps.json';
const LESSONS_FILE = 'data/courses/lessons.json';

interface ProposedStep {
  description: string;
  kind: string;
  content?: string;
  code?: string;
  language?: string;
}

interface ProposedLesson {
  lessonUuid: string;
  lessonTitle: string;
  steps: ProposedStep[];
}

interface ProposedData {
  moduleId: string;
  lessons: ProposedLesson[];
}

function uuid(): string {
  return crypto.randomUUID();
}

function isoNow(): string {
  return new Date().toISOString().slice(0, 16);
}

async function main() {
  // Читаем предложенные шаги
  const proposed: ProposedData = JSON.parse(
    readFileSync(PROPOSED_FILE, 'utf-8'),
  );
  const moduleId = proposed.moduleId;

  // Читаем текущие данные
  const steps: Record<string, unknown>[] = JSON.parse(
    readFileSync(STEPS_FILE, 'utf-8'),
  );
  const lessons: Record<string, unknown>[] = JSON.parse(
    readFileSync(LESSONS_FILE, 'utf-8'),
  );

  const now = isoNow();
  let totalCreated = 0;

  for (const lesson of proposed.lessons) {
    console.log(`\n📖 ${lesson.lessonTitle}`);

    // Находим урок в lessons.json
    const lessonRecord = lessons.find((l) => l.uuid === lesson.lessonUuid);
    if (!lessonRecord) {
      console.log(`  ❌ Урок ${lesson.lessonUuid} не найден в lessons.json`);
      continue;
    }
    const stepIds = (lessonRecord.stepIds as string[]) || [];

    for (let i = 0; i < lesson.steps.length; i++) {
      const s = lesson.steps[i];
      const stepUuid = uuid();

      // Создаём шаг
      const step: Record<string, unknown> = {
        uuid: stepUuid,
        moduleId,
        description: s.description,
        status: 'published',
        createdAt: now,
        kind: s.kind,
      };

      if (s.kind === 'text') {
        step.content = s.content || '';
      } else if (s.kind === 'code') {
        step.code = s.code || '';
        if (s.language) step.language = s.language;
      }

      steps.push(step);
      stepIds.push(stepUuid);

      console.log(
        `  [${i + 1}/${lesson.steps.length}] ✅ ${stepUuid} — ${s.description}`,
      );
      totalCreated++;
    }

    // Обновляем stepIds в уроке
    lessonRecord.stepIds = stepIds;
  }

  // Сохраняем
  writeFileSync(STEPS_FILE, JSON.stringify(steps, null, 2) + '\n');
  writeFileSync(LESSONS_FILE, JSON.stringify(lessons, null, 2) + '\n');

  console.log(`\n✅ Всего создано шагов: ${totalCreated}`);
  console.log(`   steps.json: ${steps.length} записей`);
}

main().catch((e) => {
  console.error('❌', e);
  process.exit(1);
});
