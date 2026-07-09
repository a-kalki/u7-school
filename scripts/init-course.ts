/**
 * Инициализация курса по умолчанию «Fullstack JS».
 *
 * Создаёт файл data/courses/courses.json с курсом, объединяющим
 * модули «Основы JS. Синтаксис» и «Основы JS. Алгоритмика».
 *
 * Использование:
 *   # Локально (пишет в data/courses/courses.json):
 *   bun run scripts/init-course.ts
 *
 *   # Прод (если DB_DIR отличается):
 *   DB_DIR=/srv/u7-school/data bun run scripts/init-course.ts
 *
 * Скрипт идемпотентен: если курс уже существует — выходит без изменений.
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// ─── Конфигурация ────────────────────────────────────
const DB_DIR = process.env.DB_DIR || join(import.meta.dirname, '..', 'data');
const COURSES_FILE = join(DB_DIR, 'courses', 'courses.json');

const COURSE_ID = '29adc3be-873e-47ec-aa30-61f5e6e25d4e';
const AUTHOR_ID = '8d9a56f6-51e7-49f0-ba58-2832b157e718'; // Нур

const MODULE_SYNTAX_ID = 'e4dea4fc-f8db-4b19-be2d-59fcf3ad96fa';
const MODULE_ALGO_ID = '16b9026b-7cc6-4397-81bc-9a9791d3a76b';

// ─── Проверка существования ─────────────────────────
let existing: unknown[] = [];
try {
  const raw = readFileSync(COURSES_FILE, 'utf-8');
  existing = JSON.parse(raw);
} catch {
  // Файла нет — это нормально, создадим
}

const alreadyExists = (existing as Array<{ uuid: string }>).some(
  (c) => c.uuid === COURSE_ID,
);

if (alreadyExists) {
  console.log('✅ Курс «Fullstack JS» уже существует. Ничего не делаем.');
  console.log(`   Файл: ${COURSES_FILE}`);
  process.exit(0);
}

// ─── Создание курса ─────────────────────────────────
const course = {
  uuid: COURSE_ID,
  title: 'Fullstack JS',
  description: 'Полный курс JavaScript с синтаксиса до командной разработки',
  authorId: AUTHOR_ID,
  phases: [
    {
      title: 'Этап 1: Основы JS',
      track: 'tech' as const,
      moduleIds: [MODULE_SYNTAX_ID, MODULE_ALGO_ID],
    },
  ],
  status: 'draft' as const,
  createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
  updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
};

// ─── Запись ──────────────────────────────────────────
mkdirSync(join(DB_DIR, 'courses'), { recursive: true });

const updated = [...(existing as object[]), course];
writeFileSync(COURSES_FILE, `${JSON.stringify(updated, null, 2)}\n`, 'utf-8');

console.log('✅ Курс «Fullstack JS» создан.');
console.log(`   ID: ${COURSE_ID}`);
console.log('   Этапы:');
console.log(`     - «${course.phases[0].title}» (tech): 2 модуля`);
console.log(`   Файл: ${COURSES_FILE}`);

// ─── Проверка модулей ───────────────────────────────
const modulesFile = join(DB_DIR, 'courses', 'modules.json');
try {
  const modulesRaw = readFileSync(modulesFile, 'utf-8');
  const modules = JSON.parse(modulesRaw) as Array<{
    uuid: string;
    title: string;
  }>;
  for (const modId of course.phases[0].moduleIds) {
    const mod = modules.find((m) => m.uuid === modId);
    if (mod) {
      console.log(`   ✅ Модуль найден: ${mod.title} (${mod.uuid})`);
    } else {
      console.log(`   ⚠️  Модуль НЕ найден в modules.json: ${modId}`);
    }
  }
} catch {
  console.log('   ⚠️  Не удалось проверить modules.json (файл не найден)');
}
