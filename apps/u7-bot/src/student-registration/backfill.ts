/**
 * Скрипт обратного заполнения истории прохождения курса.
 *
 * Запуск на сервере из корня проекта:
 *   bun run apps/u7-bot/src/student-registration/backfill.ts
 *
 * Что делает:
 * 1. Проверяет наличие необходимых файлов
 * 2. Читает предвычисленные данные из backfill-data.json
 * 3. Для активных студентов: добавляет недостающие шаги ДО первого существующего
 * 4. Для неактивных студентов: создаёт новые Student-записи (status: active)
 * 5. Обновляет users.json: добавляет роль STUDENT (если ещё нет)
 * 6. Сохраняет оба файла
 * 7. Валидирует результат через репозитории (JsonFileRepo → Valibot-схемы)
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

// ═══════════════════════════════════════════════════════════════
// Типы
// ═══════════════════════════════════════════════════════════════

interface StepEntry {
  stepId: string;
  status: 'completed' | 'issued';
  issuedAt: string;
  completedAt?: string;
}

interface BackfillStudent {
  userId: string;
  studentUuid: string;
  name: string;
  isActive: boolean;
  enrolledAt: string;
  currentStepId: string;
  steps: StepEntry[];
  existingStepIds?: string[];
}

interface UserRoleUpdate {
  userId: string;
}

interface BackfillData {
  streamId: string;
  totalSteps: number;
  students: BackfillStudent[];
  userRoleUpdates: UserRoleUpdate[];
}

interface StudentRecord {
  uuid: string;
  streamId: string;
  userId: string;
  enrolledAt: string;
  status: string;
  currentStepId: string;
  steps: StepEntry[];
  createdAt: string;
  updatedAt?: string;
}

interface UserRecord {
  uuid: string;
  name: string;
  telegramId: number;
  roles: string[];
  createdAt: string;
  updatedAt?: string;
}

// ═══════════════════════════════════════════════════════════════
// Конфигурация путей
// ═══════════════════════════════════════════════════════════════

const SCRIPT_DIR = import.meta.dirname;
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, '../../../../');

const STUDENTS_PATH = path.join(PROJECT_ROOT, 'data', 'streams', 'students.json');
const USERS_PATH = path.join(PROJECT_ROOT, 'data', 'users', 'users.json');
const BACKFILL_PATH = path.join(SCRIPT_DIR, 'backfill-data.json');

// ═══════════════════════════════════════════════════════════════
// Утилиты
// ═══════════════════════════════════════════════════════════════

function readJson<T>(filepath: string): T {
  const raw = fs.readFileSync(filepath, 'utf-8');
  return JSON.parse(raw) as T;
}

function writeJson(filepath: string, data: unknown): void {
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8');
}

function now(): string {
  const d = new Date();
  const y = d.getFullYear();
  const M = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${M}-${day}T${h}:${m}`;
}

function checkFileExists(filepath: string, label: string): void {
  if (!fs.existsSync(filepath)) {
    console.error(`❌ Файл не найден: ${label} (${filepath})`);
    process.exit(1);
  }
  console.log(`✅ ${label}: ${filepath}`);
}

// ═══════════════════════════════════════════════════════════════
// Основная логика
// ═══════════════════════════════════════════════════════════════

async function main(): Promise<void> {
  console.log('=== ЗАПУСК ОБРАТНОГО ЗАПОЛНЕНИЯ ИСТОРИИ ===\n');

  // 1. Проверка файлов
  console.log('1. Проверка файлов...');
  checkFileExists(STUDENTS_PATH, 'data/streams/students.json');
  checkFileExists(USERS_PATH, 'data/users/users.json');
  checkFileExists(BACKFILL_PATH, 'backfill-data.json');
  console.log('');

  // 2. Чтение данных
  console.log('2. Чтение данных...');
  const backfill = readJson<BackfillData>(BACKFILL_PATH);
  const dbStudents = readJson<StudentRecord[]>(STUDENTS_PATH);
  const dbUsers = readJson<UserRecord[]>(USERS_PATH);
  console.log(`   Студентов в БД: ${dbStudents.length}`);
  console.log(`   Пользователей в БД: ${dbUsers.length}`);
  console.log(`   Записей в backfill: ${backfill.students.length}`);

  // Проверка: в БД должно быть ровно 5 активных студентов потока
  const streamId = backfill.streamId;
  const streamStudents = dbStudents.filter((s) => s.streamId === streamId);
  if (streamStudents.length !== 5) {
    console.error(`❌ Ожидалось 5 студентов потока, найдено: ${streamStudents.length}`);
    process.exit(1);
  }
  console.log(`   ✅ Студентов в потоке: ${streamStudents.length} (как и ожидалось)`);
  console.log('');

  let studentsModified = 0;
  let stepsAdded = 0;
  let studentsCreated = 0;
  let usersUpdated = 0;

  // 3. Обработка студентов
  console.log('3. Обработка студентов...');

  for (const bf of backfill.students) {
    if (bf.isActive) {
      // ── Активный студент: найти запись в БД и добавить шаги ──
      const existing = dbStudents.find(
        (s) => s.userId === bf.userId && s.streamId === streamId,
      );

      if (!existing) {
        console.log(`   ⚠ ${bf.name}: активный студент не найден в БД, пропускаем`);
        continue;
      }

      const existingStepIds = new Set(existing.steps.map((s) => s.stepId));

      const newSteps: StepEntry[] = [];
      for (const step of bf.steps) {
        if (!existingStepIds.has(step.stepId)) {
          newSteps.push(step);
        }
      }

      if (newSteps.length === 0) {
        console.log(`   - ${bf.name}: нечего добавлять (${existing.steps.length} шагов уже есть)`);
        continue;
      }

      // Вставляем перед существующими шагами
      existing.steps = [...newSteps, ...existing.steps];
      existing.updatedAt = now();
      studentsModified++;
      stepsAdded += newSteps.length;

      console.log(`   + ${bf.name}: добавлено ${newSteps.length} шагов (всего ${existing.steps.length})`);
    } else {
      // ── Неактивный студент: создать новую запись (status: active) ──
      const alreadyExists = dbStudents.some(
        (s) => s.userId === bf.userId && s.streamId === streamId,
      );

      if (alreadyExists) {
        console.log(`   ⚠ ${bf.name}: уже есть запись в потоке, пропускаем`);
        continue;
      }

      const ts = now();
      const record: StudentRecord = {
        uuid: bf.studentUuid,
        streamId: streamId,
        userId: bf.userId,
        enrolledAt: bf.enrolledAt,
        status: 'active',
        currentStepId: bf.currentStepId,
        steps: bf.steps,
        createdAt: ts,
      };

      dbStudents.push(record);
      studentsCreated++;
      stepsAdded += bf.steps.length;

      console.log(`   + ${bf.name}: создана запись с ${bf.steps.length} шагами`);
    }
  }

  console.log('');

  // 4. Обновление ролей пользователей
  console.log('4. Обновление ролей пользователей...');

  for (const update of backfill.userRoleUpdates) {
    const user = dbUsers.find((u) => u.uuid === update.userId);
    if (!user) {
      console.log(`   ⚠ userId ${update.userId.slice(0, 8)}... не найден`);
      continue;
    }

    if (user.roles.includes('STUDENT')) {
      console.log(`   - ${user.name}: роль STUDENT уже есть`);
      continue;
    }

    user.roles.push('STUDENT');
    user.updatedAt = now();
    usersUpdated++;
    console.log(`   + ${user.name}: добавлена роль STUDENT`);
  }

  console.log('');

  // 5. Сохранение
  console.log('5. Сохранение...');
  writeJson(STUDENTS_PATH, dbStudents);
  console.log(`   ✅ data/streams/students.json (${dbStudents.length} записей)`);
  writeJson(USERS_PATH, dbUsers);
  console.log(`   ✅ data/users/users.json (${dbUsers.length} записей)`);

  // 6. Валидация через репозитории
  console.log('\n6. Валидация через репозитории...');

  try {
    const { StudentJsonRepo } = await import('@u7-scl/stream');
    const { UserJsonRepo } = await import('@u7-scl/user');

    // Валидация students.json
    let validationOk = true;

    const studentRepo = new StudentJsonRepo(STUDENTS_PATH);
    const validatedStudents = await studentRepo.getByStream(streamId);
    const expectedCount = streamStudents.length + studentsCreated;

    if (validatedStudents.length !== expectedCount) {
      validationOk = false;
      console.error(
        `   ❌ students.json: ожидалось ${expectedCount} записей в потоке, после валидации — ${validatedStudents.length}`,
      );
      console.error('      Какие-то записи не прошли валидацию по StudentSchema!');
    } else {
      console.log(`   ✅ students.json: все ${validatedStudents.length} записей валидны`);
    }

    // Дополнительно проверим каждую новую запись
    for (const bf of backfill.students.filter((s) => !s.isActive)) {
      const found = validatedStudents.find((s) => s.uuid === bf.studentUuid);
      if (!found) {
        validationOk = false;
        console.error(`   ❌ Не найдена созданная запись: ${bf.name} (${bf.studentUuid})`);
      }
    }

    // Валидация users.json
    const userRepo = new UserJsonRepo(USERS_PATH);
    const validatedUsers = await userRepo.getAll();
    const expectedUserCount = dbUsers.length;

    if (validatedUsers.length !== expectedUserCount) {
      validationOk = false;
      console.error(
        `   ❌ users.json: ожидалось ${expectedUserCount} записей, после валидации — ${validatedUsers.length}`,
      );
      console.error('      Какие-то записи не прошли валидацию по UserSchema!');
    } else {
      console.log(`   ✅ users.json: все ${validatedUsers.length} записей валидны`);
    }

    // Проверка ролей
    for (const update of backfill.userRoleUpdates) {
      const vu = validatedUsers.find((u) => u.uuid === update.userId);
      if (vu && !vu.roles.includes('STUDENT')) {
        validationOk = false;
        console.error(`   ❌ Роль STUDENT не применилась: ${vu.name}`);
      }
    }

    if (!validationOk) {
      console.error('\n❌ ВАЛИДАЦИЯ НЕ ПРОЙДЕНА! Откати изменения вручную.');
      process.exit(1);
    }

    console.log('   ✅ Все проверки пройдены');
  } catch (err) {
    console.error('   ❌ Ошибка при валидации:', err instanceof Error ? err.message : String(err));
    console.error('      Проверь, что проект собран и зависимости разрешены.');
    process.exit(1);
  }

  console.log('');
  console.log('=== ГОТОВО ===');
  console.log(`Студентов изменено: ${studentsModified}`);
  console.log(`Студентов создано: ${studentsCreated}`);
  console.log(`Шагов добавлено: ${stepsAdded}`);
  console.log(`Ролей добавлено: ${usersUpdated}`);
}

main().catch((err) => {
  console.error('Неожиданная ошибка:', err);
  process.exit(1);
});
