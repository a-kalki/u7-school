/**
 * Миграция статусов студентов: dropped/expelled → abandoned.
 *
 * Правила:
 * - `dropped`  → `abandoned` + abandonDetails { who: 'self', cause: 'voluntary' }
 * - `expelled` → `abandoned` + abandonDetails { who: 'mentor', cause: 'by_mentor' }
 * - Остальные статусы не трогаем.
 *
 * Использование:
 *   # Локально (фикстуры для тестов):
 *   bun run scripts/migrate-student-statuses.ts
 *
 *   # Прод (реальные данные):
 *   bun run scripts/migrate-student-statuses.ts --prod
 *
 *   # Произвольный файл:
 *   STUDENTS_FILE=/path/to/students.json bun run scripts/migrate-student-statuses.ts
 *
 * Скрипт идемпотентен: повторный запуск не меняет уже мигрированные записи.
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// ─── Определение пути ────────────────────────────────
const isProd = process.argv.includes('--prod');
const envFile = process.env.STUDENTS_FILE;

const FIXTURES_DIR = join(
  import.meta.dirname,
  '..',
  'data',
  'fixtures',
  'streams',
);
const PROD_DIR = join(import.meta.dirname, '..', 'data', 'streams');
const BACKUP_DIR = join(import.meta.dirname, '..', 'data', 'migrations');

const STUDENTS_FILE = envFile
  ? envFile
  : isProd
    ? join(PROD_DIR, 'students.json')
    : join(FIXTURES_DIR, 'students.json');

console.log(`📂 Файл данных: ${STUDENTS_FILE}`);
console.log(`📁 Бэкап: ${BACKUP_DIR}`);

// ─── Типы ────────────────────────────────────────────
interface StudentRecord {
  uuid: string;
  streamId: string;
  userId: string;
  enrolledAt: string;
  status: string;
  currentStepId: string;
  steps: Array<Record<string, unknown>>;
  createdAt: string;
  updatedAt?: string;
  abandonDetails?: { who: string; cause: string };
}

const migrationMap: Record<string, { who: string; cause: string }> = {
  dropped: { who: 'self', cause: 'voluntary' },
  expelled: { who: 'mentor', cause: 'by_mentor' },
};

// ─── Чтение ──────────────────────────────────────────
let raw: string;
try {
  raw = readFileSync(STUDENTS_FILE, 'utf-8');
} catch {
  console.error(`❌ Файл не найден: ${STUDENTS_FILE}`);
  process.exit(1);
}

const students: StudentRecord[] = JSON.parse(raw);

// ─── Миграция ────────────────────────────────────────
let migratedCount = 0;
let skippedCount = 0;

for (const s of students) {
  const mapping = migrationMap[s.status];
  if (mapping) {
    s.status = 'abandoned';
    s.abandonDetails = mapping;
    s.updatedAt = new Date().toISOString().replace('T', ' ').slice(0, 19);
    migratedCount++;
  } else {
    skippedCount++;
  }
}

if (migratedCount === 0) {
  console.log(
    '✅ Миграция не требуется — все записи уже в актуальном состоянии.',
  );
  console.log(`   Проверено записей: ${skippedCount}`);
  process.exit(0);
}

// ─── Бэкап ───────────────────────────────────────────
mkdirSync(BACKUP_DIR, { recursive: true });
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupPath = join(BACKUP_DIR, `students-backup-${timestamp}.json`);
writeFileSync(backupPath, raw, 'utf-8');

// ─── Запись ──────────────────────────────────────────
writeFileSync(STUDENTS_FILE, `${JSON.stringify(students, null, 2)}\n`, 'utf-8');

console.log(
  `✅ Миграция завершена: ${migratedCount} записей обновлено (dropped/expelled → abandoned).`,
);
console.log(`   Пропущено (уже актуальны): ${skippedCount}`);
console.log(`📁 Бэкап: ${backupPath}`);
