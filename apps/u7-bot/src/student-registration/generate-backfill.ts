/**
 * Генератор данных для обратного заполнения истории прохождения курса.
 *
 * Запуск локально:
 *   bun run apps/u7-bot/src/student-registration/generate-backfill.ts
 *
 * Читает ssh-streams.json, ssh-students.json, ssh-users.json
 * и генерирует backfill-data.json с предвычисленным таймлайном и шагами.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

// ═══════════════════════════════════════════════════════════════
// Конфигурация
// ═══════════════════════════════════════════════════════════════

const DIR = import.meta.dirname;
const STREAM_ID = '8ae94921-8af6-4fb6-ad1d-60bd2f8ee394';

/** Опорные точки таймлайна: [глобальный индекс шага (0-based), дата] */
interface Milestone {
  stepIndex: number;
  date: string; // YYYY-MM-DDTHH:MM
}

// Шаги: p1=50, p2=41, p3=31, p4=48 (всего 170)
const MILESTONES: Milestone[] = [
  { stepIndex: 0, date: '2026-06-02T09:00' },    // p1-l1-s1
  { stepIndex: 50, date: '2026-06-09T09:00' },    // p2-l1-s1 (0-based: 50)
  { stepIndex: 91, date: '2026-06-15T09:00' },    // p3-l1-s1 (0-based: 91)
  { stepIndex: 122, date: '2026-06-18T09:00' },   // p4-l1-s1 (0-based: 122)
  { stepIndex: 161, date: '2026-06-22T12:00' },   // p4-l7 (мастер-класс)
  { stepIndex: 169, date: '2026-06-23T18:00' },   // последний шаг
];

/** Рабочие дни в периоде (включая субботы) */
const WORKDAYS = new Set([
  '2026-06-02', '2026-06-03', '2026-06-04', '2026-06-05', '2026-06-08',  // p1
  '2026-06-09', '2026-06-10', '2026-06-11', '2026-06-12', '2026-06-13',  // p2
  '2026-06-15', '2026-06-16', '2026-06-17',                               // p3
  '2026-06-18', '2026-06-19', '2026-06-20', '2026-06-22', '2026-06-23',  // p4
]);

// ═══════════════════════════════════════════════════════════════
// Чтение входных данных
// ═══════════════════════════════════════════════════════════════

interface StreamData {
  uuid: string;
  contentSnapshot: Array<{
    projectId: string;
    projectTitle: string;
    lessons: Array<{
      lessonId: string;
      lessonTitle: string;
      stepIds: string[];
    }>;
  }>;
}

interface StudentRecord {
  uuid: string;
  streamId: string;
  userId: string;
  status: string;
  currentStepId: string;
  steps: Array<{ stepId: string; status: string; issuedAt: string; completedAt?: string }>;
  enrolledAt: string;
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

function readJson<T>(filepath: string): T {
  const raw = fs.readFileSync(filepath, 'utf-8');
  return JSON.parse(raw) as T;
}

const streamData = readJson<StreamData[]>(path.join(DIR, 'ssh-streams.json'))[0]!;
const activeStudents = readJson<StudentRecord[]>(path.join(DIR, 'ssh-students.json'));
const allUsers = readJson<UserRecord[]>(path.join(DIR, 'ssh-users.json'));

// ═══════════════════════════════════════════════════════════════
// Хардкод-список студентов (из constants.ts)
// ═══════════════════════════════════════════════════════════════

const STUDENT_LIST: Array<{ name: string; telegramId: number; uuid: string; lesson: string }> = [
  { name: 'Alex',     telegramId: 5167204720, uuid: 'b39a00a8-af8b-4f43-a270-176fc3b4ac7b', lesson: 'пропустить' },
  { name: 'Нұрым',    telegramId: 1274181696, uuid: '5af02d03-952b-4914-9b86-8a94a9e127c1', lesson: 'пропустить' },
  { name: 'Vice',     telegramId: 1886053369, uuid: 'f3abd8ad-95dd-4b5f-86f8-b14c97b48c64', lesson: 'пропустить' },
  { name: 'Ибрахим',  telegramId: 7976471166, uuid: '62b1080d-2ad0-4e16-88eb-ea20ac1fa0ae', lesson: 'середина p1' },
  { name: 'Aidar',    telegramId: 952537114,  uuid: 'd9f1694f-ef7e-495f-9389-080da724828f', lesson: 'середина p1' },
  { name: 'Nur',      telegramId: 671999593,  uuid: '0f6e594c-b6ab-4ed4-af6d-d4406dae4b8e', lesson: 'середина p1' },
  { name: 'Ismail',   telegramId: 2023546466, uuid: 'c77ace46-414f-4a0b-97c2-da5ecc5fbdc3', lesson: 'середина p2' },
  { name: 'nurts.nu', telegramId: 6888927793, uuid: 'fef43a67-0bae-4759-b172-057736aa5401', lesson: 'середина p1' },
  { name: 'Asema🤍',  telegramId: 923356508,  uuid: '51a05e8f-b339-47e3-bb62-119aa8558363', lesson: 'начало p1' },
  { name: 'Мират ☀️', telegramId: 7339477355, uuid: '4e7d618a-0cb1-40a4-bf2e-add225b14c29', lesson: 'начало p1' },
  { name: 'Dina',     telegramId: 795572232,  uuid: '0cba1f15-c7bc-448c-9064-d9eab302a185', lesson: 'середина p3' },
  { name: 'Zarina',   telegramId: 756418382,  uuid: '7e76a369-2e20-4075-bbf0-b6648ea3bc21', lesson: 'середина p3' },
  { name: 'нур',      telegramId: 1474054578, uuid: 'e1be6010-717e-448e-8a08-a27f4eeb6850', lesson: 'середина p2' },
  { name: 'Laura',    telegramId: 1060467091, uuid: '068e0099-db55-4acd-8709-9a05b1b95b4b', lesson: 'пропустить' },
  { name: 'Мария',    telegramId: 8960175810, uuid: '81a4ebf2-7186-43fe-b877-17f8fa4e0e2d', lesson: 'пропустить' },
  { name: 'ᅠᅠ',       telegramId: 7467906232, uuid: '98993dd2-b888-47be-9bb3-f9dbef694de1', lesson: 'середина p1' },
];

// ═══════════════════════════════════════════════════════════════
// Извлечение упорядоченного списка всех stepIds
// ═══════════════════════════════════════════════════════════════

function extractAllStepIds(snapshot: StreamData['contentSnapshot']): string[] {
  const ids: string[] = [];
  for (const project of snapshot) {
    for (const lesson of project.lessons) {
      ids.push(...lesson.stepIds);
    }
  }
  return ids;
}

const allStepIds = extractAllStepIds(streamData.contentSnapshot);
const stepIndexMap = new Map<string, number>();
allStepIds.forEach((id, i) => stepIndexMap.set(id, i));

console.log(`Всего шагов в курсе: ${allStepIds.length}`);

// ═══════════════════════════════════════════════════════════════
// Вычисление таймлайна
// ═══════════════════════════════════════════════════════════════

/** Форматирует Date в YYYY-MM-DDTHH:MM (без секунд) */
function formatDate(d: Date): string {
  const y = d.getFullYear();
  const M = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${M}-${day}T${h}:${m}`;
}

/**
 * Строит полный таймлайн: stepId → дата.
 * Равномерно распределяет шаги по рабочим минутам (09:00–18:00) между опорными точками.
 */
function buildTimeline(stepIds: string[]): Map<string, string> {
  const timeline = new Map<string, string>();
  const sortedWorkdays = [...WORKDAYS].sort();
  const DAY_MINUTES = 9 * 60; // 540 минут в рабочем дне (09:00–18:00)

  for (let seg = 0; seg < MILESTONES.length - 1; seg++) {
    const m1 = MILESTONES[seg]!;
    const m2 = MILESTONES[seg + 1]!;
    // Для последнего сегмента включаем конечную точку; для остальных — нет
    // (потому что m2 каждой промежуточной точки — это начало следующего сегмента)
    const isLast = seg === MILESTONES.length - 2;
    const stepsInSeg = isLast
      ? m2.stepIndex - m1.stepIndex + 1
      : m2.stepIndex - m1.stepIndex;
    if (stepsInSeg <= 0) continue;

    const t1 = new Date(m1.date).getTime();
    const t2 = new Date(m2.date).getTime();
    const totalMs = t2 - t1;

    // Собираем все рабочие минуты между m1 и m2
    const slots: number[] = [];
    for (const wd of sortedWorkdays) {
      const dayStart = new Date(`${wd}T09:00`).getTime();
      const dayEnd = new Date(`${wd}T18:00`).getTime();

      // Пересечение рабочего дня с [t1, t2]
      const slotStart = Math.max(dayStart, t1);
      const slotEnd = Math.min(dayEnd, t2);

      if (slotStart < slotEnd) {
        // Добавляем каждую минуту этого слота
        for (let ms = slotStart; ms <= slotEnd; ms += 60000) {
          slots.push(ms);
        }
      }
    }

    if (slots.length === 0) {
      // Запасной вариант — если нет рабочих минут
      for (let i = 0; i < stepsInSeg; i++) {
        const idx = m1.stepIndex + i;
        const ts = t1 + ((i + 1) / (stepsInSeg + 1)) * totalMs;
        timeline.set(stepIds[idx]!, formatDate(new Date(ts)));
      }
      continue;
    }

    // Равномерно выбираем stepsInSeg слотов из доступных (floor гарантирует уникальность)
    const stepsMinus1 = Math.max(stepsInSeg - 1, 1);
    for (let i = 0; i < stepsInSeg; i++) {
      const idx = m1.stepIndex + i;
      const slotIdx = Math.floor((i / stepsMinus1) * (slots.length - 1));
      const ts = slots[Math.min(slotIdx, slots.length - 1)]!;
      timeline.set(stepIds[idx]!, formatDate(new Date(ts)));
    }
  }

  return timeline;
}

const timeline = buildTimeline(allStepIds);

// Вывод первых и последних для проверки
console.log('Таймлайн:');
console.log(`  Первый шаг (${allStepIds[0]}): ${timeline.get(allStepIds[0]!)}`);
console.log(`  Шаг #50  (${allStepIds[50]}): ${timeline.get(allStepIds[50]!)}`);
console.log(`  Шаг #91  (${allStepIds[91]}): ${timeline.get(allStepIds[91]!)}`);
console.log(`  Шаг #122 (${allStepIds[122]}): ${timeline.get(allStepIds[122]!)}`);
console.log(`  Шаг #161 (${allStepIds[161]}): ${timeline.get(allStepIds[161]!)}`);
console.log(`  Последний (${allStepIds[169]}): ${timeline.get(allStepIds[169]!)}`);

// ═══════════════════════════════════════════════════════════════
// Обработка студентов
// ═══════════════════════════════════════════════════════════════

interface BackfillStepsEntry {
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
  steps: BackfillStepsEntry[];
  /** Для активных — не трогать существующие шаги до этого индекса */
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

function generateBackfillData(): BackfillData {
  const activeSet = new Set(activeStudents.map((s) => s.userId));
  const activeByUserId = new Map(activeStudents.map((s) => [s.userId, s]));

  const students: BackfillStudent[] = [];
  const userRoleUpdates: UserRoleUpdate[] = [];
  const seenStudents = new Set<string>();

  for (const entry of STUDENT_LIST) {
    // Пропускаем дубликаты (Nur-админ и Nur-студент имеют разные telegramId, но если uuid совпадает — пропускаем)
    if (seenStudents.has(entry.uuid)) continue;
    seenStudents.add(entry.uuid);

    const isActive = activeSet.has(entry.uuid) && entry.lesson === 'пропустить';
    const existingRecord = activeByUserId.get(entry.uuid);

    if (isActive && existingRecord) {
      // ── Активный студент ──
      const existingStepSet = new Set(existingRecord.steps.map((s) => s.stepId));

      // Найти первый (самый ранний) существующий шаг
      let firstExistingIndex = allStepIds.length;
      for (const s of existingRecord.steps) {
        const idx = stepIndexMap.get(s.stepId);
        if (idx !== undefined && idx < firstExistingIndex) {
          firstExistingIndex = idx;
        }
      }

      // Генерируем шаги от начала до первого существующего (не включая его)
      const steps: BackfillStepsEntry[] = [];
      for (let i = 0; i < firstExistingIndex; i++) {
        const stepId = allStepIds[i]!;
        if (existingStepSet.has(stepId)) continue; // уже есть (не должно быть, но на всякий)

        const issuedAt = timeline.get(stepId)!;
        steps.push({
          stepId,
          status: 'completed',
          issuedAt,
          completedAt: issuedAt, // исторические — завершены в тот же день
        });
      }

      students.push({
        userId: entry.uuid,
        studentUuid: entry.uuid,
        name: entry.name,
        isActive: true,
        enrolledAt: existingRecord.enrolledAt,
        currentStepId: existingRecord.currentStepId,
        steps,
        existingStepIds: existingRecord.steps.map((s) => s.stepId),
      });

      console.log(`  [актив] ${entry.name}: шагов ${existingRecord.steps.length} → добавляем ${steps.length} до первого существующего`);
    } else {
      // ── Неактивный студент ──
      const stopIndex = pickStopIndex(entry.lesson);

      const steps: BackfillStepsEntry[] = [];
      for (let i = 0; i < stopIndex; i++) {
        const stepId = allStepIds[i]!;
        const issuedAt = timeline.get(stepId)!;
        steps.push({
          stepId,
          status: 'completed',
          issuedAt,
          completedAt: issuedAt,
        });
      }

      // Последний шаг — issued
      const lastStepId = allStepIds[stopIndex]!;
      const lastIssuedAt = timeline.get(lastStepId)!;
      steps.push({
        stepId: lastStepId,
        status: 'issued',
        issuedAt: lastIssuedAt,
      });

      // Проверяем, есть ли у пользователя роль STUDENT
      const user = allUsers.find((u) => u.uuid === entry.uuid);
      if (user && !user.roles.includes('STUDENT')) {
        userRoleUpdates.push({ userId: entry.uuid });
      }

      students.push({
        userId: entry.uuid,
        studentUuid: crypto.randomUUID(),
        name: entry.name,
        isActive: false,
        enrolledAt: user?.createdAt ?? timeline.get(allStepIds[0]!)!,
        currentStepId: lastStepId,
        steps,
      });

      console.log(`  [неакт] ${entry.name}: "${entry.lesson}" → остановка на шаге #${stopIndex} (${lastStepId.slice(0, 8)}...), шагов: ${steps.length}`);
    }
  }

  return {
    streamId: STREAM_ID,
    totalSteps: allStepIds.length,
    students,
    userRoleUpdates,
  };
}

/** Выбирает случайный индекс шага остановки на основе lesson-подсказки */
function pickStopIndex(lesson: string): number {
  let min: number, max: number;

  switch (lesson) {
    case 'начало p1':
      min = 3; max = 12;
      break;
    case 'середина p1':
      min = 15; max = 32;
      break;
    case 'середина p2':
      min = 60; max = 80;
      break;
    case 'середина p3':
      min = 100; max = 115;
      break;
    default:
      min = 15; max = 32; // fallback
  }

  const range = max - min;
  const randomOffset = Math.floor(Math.random() * (range + 1));
  return min + randomOffset;
}

// ═══════════════════════════════════════════════════════════════
// Генерация и запись
// ═══════════════════════════════════════════════════════════════

function generateStepLabel(stepId: string): string {
  for (let pi = 0; pi < streamData.contentSnapshot.length; pi++) {
    const project = streamData.contentSnapshot[pi]!;
    for (let li = 0; li < project.lessons.length; li++) {
      const lesson = project.lessons[li]!;
      const si = lesson.stepIds.indexOf(stepId);
      if (si !== -1) {
        return `p${pi + 1}-l${li + 1}-s${si + 1} / ${lesson.lessonTitle}`;
      }
    }
  }
  return `(unknown)`;
}

const data = generateBackfillData();

// Вывод статистики
console.log('\n=== СТАТИСТИКА ===');
console.log(`Активных студентов: ${data.students.filter((s) => s.isActive).length}`);
console.log(`Неактивных студентов: ${data.students.filter((s) => !s.isActive).length}`);
console.log(`Нужно добавить роль STUDENT: ${data.userRoleUpdates.length}`);
for (const u of data.userRoleUpdates) {
  const s = data.students.find((s) => s.userId === u.userId);
  console.log(`  - ${s?.name} (${u.userId.slice(0, 8)}...)`);
}

// Проверка: вывести по одному шагу каждого активного студента
console.log('\n=== ПРОВЕРКА АКТИВНЫХ ===');
for (const s of data.students.filter((s) => s.isActive)) {
  console.log(`${s.name}:`);
  console.log(`  добавляется: ${s.steps.length} шагов`);
  if (s.steps.length > 0) {
    console.log(`  первый добавляемый: ${generateStepLabel(s.steps[0]!.stepId)} @ ${s.steps[0]!.issuedAt}`);
    console.log(`  последний добавляемый: ${generateStepLabel(s.steps[s.steps.length - 1]!.stepId)} @ ${s.steps[s.steps.length - 1]!.issuedAt}`);
  }
  console.log(`  существующих не трогаем: ${s.existingStepIds?.length ?? 0} шт.`);
}

// Проверка: вывести неактивных
console.log('\n=== ПРОВЕРКА НЕАКТИВНЫХ ===');
for (const s of data.students.filter((s) => !s.isActive)) {
  const last = s.steps[s.steps.length - 1]!;
  console.log(`${s.name}: ${s.steps.length} шагов, остановка на ${generateStepLabel(last.stepId)} @ ${last.issuedAt}`);
}

// Запись в файл
const outPath = path.join(DIR, 'backfill-data.json');
fs.writeFileSync(outPath, JSON.stringify(data, null, 2), 'utf-8');
console.log(`\n✅ Записано в ${outPath}`);
console.log(`Размер: ${(fs.statSync(outPath).size / 1024).toFixed(1)} KB`);
