/**
 * Миграция статусов студентов: dropped/expelled → abandoned.
 *
 * Правила:
 * - `dropped` → `abandoned` + abandonDetails: { who: 'self', cause: 'voluntary' }
 * - `expelled` → `abandoned` + abandonDetails: { who: 'mentor', cause: 'by_mentor' }
 * - Остальные статусы не трогаем.
 *
 * Запуск: bun run scripts/migrate-student-statuses.ts
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const FIXTURES_DIR = join(
  import.meta.dirname,
  '..',
  'data',
  'fixtures',
  'streams',
);
const BACKUP_DIR = join(import.meta.dirname, '..', 'data', 'migrations');
const STUDENTS_FILE = join(FIXTURES_DIR, 'students.json');

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

// 1. Читаем текущие данные
const raw = readFileSync(STUDENTS_FILE, 'utf-8');
const students: StudentRecord[] = JSON.parse(raw);

let migratedCount = 0;

for (const s of students) {
  const mapping = migrationMap[s.status];
  if (mapping) {
    s.status = 'abandoned';
    s.abandonDetails = mapping;
    s.updatedAt = new Date().toISOString().replace('T', ' ').slice(0, 19);
    migratedCount++;
  }
}

// 2. Бэкап
mkdirSync(BACKUP_DIR, { recursive: true });
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
writeFileSync(
  join(BACKUP_DIR, `students-backup-${timestamp}.json`),
  raw,
  'utf-8',
);

// 3. Запись
writeFileSync(
  STUDENTS_FILE,
  `${JSON.stringify(students, null, 2)}
`,
  'utf-8',
);

console.log(
  `✅ Миграция завершена: ${migratedCount} записей обновлено (dropped/expelled → abandoned).`,
);
console.log(`📁 Бэкап: data/migrations/students-backup-${timestamp}.json`);
