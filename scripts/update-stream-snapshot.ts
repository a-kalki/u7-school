/**
 * update-stream-snapshot — обновляет contentSnapshot у ПОТОКА (точечно).
 *
 * ⚠️ История: раньше скрипт принимал moduleId и обновлял ВСЕ потоки модуля —
 * это затирало снапшот активных потоков. Теперь параметр — streamId:
 * обновляется ровно один выбранный поток.
 *
 * Использование:
 *   bun run scripts/update-stream-snapshot.ts              # интерактивный выбор потока
 *   bun run scripts/update-stream-snapshot.ts <streamId>   # конкретный поток
 *
 * Снапшот строится из актуальных данных модуля потока (get-module-snapshot):
 * только published-проекты и published-уроки.
 */

import type { ContentSnapshot } from '@u7-scl/course/domain';
import type { Student } from '../packages/stream/src/domain/student/entity';
import { createApp } from './_app-factory';
import {
  analyzeSnapshotDelta,
  syncAheadStudents,
} from './stream-snapshot-sync';

const STREAMS_FILE = 'data/streams/streams.json';
const STUDENTS_FILE = 'data/streams/students.json';
const USERS_FILE = 'data/users/users.json';

interface StreamInfo {
  index: number;
  uuid: string;
  title: string;
  moduleId: string;
  status: string;
  projectCount: number;
}

async function main() {
  // ── Чтение потоков ──────────────────────────────
  const streamsFile = Bun.file(STREAMS_FILE);
  const streams: Array<Record<string, unknown>> = await streamsFile.json();

  const allStreams: StreamInfo[] = [];
  for (let i = 0; i < streams.length; i++) {
    const s = streams[i];
    if (!s || s.uuid === undefined) continue;
    const snap = s.contentSnapshot as Array<{ lessons: unknown[] }> | undefined;
    allStreams.push({
      index: i,
      uuid: s.uuid as string,
      title: (s.title as string) ?? '(без названия)',
      moduleId: s.moduleId as string,
      status: (s.status as string) ?? '?',
      projectCount: snap?.length ?? 0,
    });
  }

  if (allStreams.length === 0) {
    console.log('Потоки не найдены.');
    return;
  }

  // ── Парсинг аргументов командной строки ─────────
  const args = process.argv.slice(2);
  const syncStudentsFlag =
    args.includes('--sync-students') ||
    args.includes('--mark-passed-completed');
  const dryRunFlag = args.includes('--dry-run');
  const explicitId = args.find((a) => !a.startsWith('--'));
  let selected: StreamInfo | undefined;

  if (explicitId) {
    selected = allStreams.find((s) => s.uuid === explicitId);
    if (!selected) {
      console.error(`❌ Поток с uuid=${explicitId} не найден.`);
      console.log('Доступные потоки:');
      for (const s of allStreams) {
        console.log(
          `   ${s.uuid}  ${s.title} (${s.status}, ${s.projectCount} проектов)`,
        );
      }
      process.exit(1);
    }
  } else {
    console.log('Потоки:\n');
    for (const s of allStreams) {
      console.log(
        `  [${s.index + 1}] ${s.title}  (${s.status}, ${s.projectCount} проектов)  ${s.uuid}`,
      );
    }
    console.log();
    const input = prompt('Выбери номер потока (или Enter — выйти):');
    if (!input?.trim()) {
      console.log('Выход.');
      return;
    }
    const choice = Number.parseInt(input.trim(), 10);
    selected = allStreams.find((s) => s.index + 1 === choice);
    if (!selected) {
      console.error(`Нет потока с номером ${choice}.`);
      process.exit(1);
    }
  }

  const stream = selected;
  if (!stream) throw new Error('Поток не выбран');

  // ── Получение свежего снапшота ──────────────────
  console.log(`\n📦 Поднимаю приложение...`);
  const app = createApp(true);

  console.log(
    `🔍 Получаю снапшот модуля ${stream.moduleId} (поток «${stream.title}»)...`,
  );
  const newSnapshot = await app.execute('get-module-snapshot', {
    moduleId: stream.moduleId,
  });

  const projectCount = newSnapshot.length;
  const lessonCount = newSnapshot.reduce((sum, p) => sum + p.lessons.length, 0);
  const stepCount = newSnapshot.reduce(
    (sum, p) => sum + p.lessons.reduce((s, l) => s + l.stepIds.length, 0),
    0,
  );
  console.log(
    `   ${projectCount} проектов, ${lessonCount} уроков, ${stepCount} шагов:`,
  );
  for (const p of newSnapshot) {
    console.log(`     • ${p.projectTitle} (${p.lessons.length} уроков)`);
  }

  // ── Старый поток и снапшот ─────────────────────
  const oldStream = streams[stream.index];
  if (!oldStream)
    throw new Error(`Поток ${stream.uuid} не найден в ${STREAMS_FILE}`);
  const oldSnapshot = (oldStream.contentSnapshot ?? []) as ContentSnapshot;

  // ── Проверка дельты контента и студентов ────────
  let students: Student[] = [];
  try {
    const studentsFile = Bun.file(STUDENTS_FILE);
    if (await studentsFile.exists()) {
      students = (await studentsFile.json()) as Student[];
    }
  } catch (err) {
    console.warn(`⚠️ Не удалось прочитать ${STUDENTS_FILE}:`, err);
  }

  const streamStudents = students.filter((s) => s.streamId === stream.uuid);
  const delta = analyzeSnapshotDelta(
    oldSnapshot,
    newSnapshot as ContentSnapshot,
    streamStudents,
  );

  if (delta.addedStepIds.length > 0) {
    console.log(
      `\n✨ Обнаружены новые шаги в программе (+${delta.addedStepIds.length}):`,
    );
    for (const sid of delta.addedStepIds) {
      console.log(`     • ${sid}`);
    }
  }

  if (delta.hasConflict) {
    // Загрузим пользователей для красивого отчёта
    let usersMap = new Map<string, string>();
    try {
      const usersFile = Bun.file(USERS_FILE);
      if (await usersFile.exists()) {
        const usersList = (await usersFile.json()) as Array<{
          uuid: string;
          name?: string;
          nick?: string;
        }>;
        usersMap = new Map(
          usersList.map((u) => [
            u.uuid,
            `${u.name ?? 'Студент'}${u.nick ? ` (@${u.nick})` : ''}`,
          ]),
        );
      }
    } catch {
      // noop
    }

    console.log(
      `\n⚠️ ВНИМАНИЕ: Новые шаги добавлены позади студентов, которые уже прошли эту точку!`,
    );
    console.log(`   Затронуто студентов: ${delta.aheadStudents.length}`);
    for (const ah of delta.aheadStudents) {
      const studentName = usersMap.get(ah.userId) ?? ah.studentUuid.slice(0, 8);
      console.log(
        `     - ${studentName}: текущий шаг #${ah.currentStepIndex + 1} (${ah.currentStepId}), новый шаг #${ah.newStepIndex + 1} (${ah.newStepId})`,
      );
    }

    if (!syncStudentsFlag) {
      console.error(
        `\n❌ ОТКАЗ: Без синхронизации у этих студентов сломается прогресс уроков и статус проектов.`,
      );
      console.error(
        `   Чтобы обновить снапшот И автоматически пометить добавленные шаги как пройденные у ушедших вперёд студентов, передайте флаг:`,
      );
      console.error(
        `     bun run scripts/update-stream-snapshot.ts ${stream.uuid} --sync-students\n`,
      );
      process.exit(1);
    }

    console.log(
      `\n⚙️ Передан флаг --sync-students: выполняю синхронизацию профилей студентов...`,
    );
    const syncResult = syncAheadStudents(
      newSnapshot as ContentSnapshot,
      streamStudents,
      delta.addedStepIds,
    );
    console.log(
      `   ✅ Обновлено студентов: ${syncResult.updatedCount} (${syncResult.updatedStudentUuids.join(', ')})`,
    );
  }

  // ── Обновление ТОЛЬКО выбранного потока ─────────
  const oldCount = Array.isArray(oldSnapshot) ? oldSnapshot.length : 0;
  const oldTitles = Array.isArray(oldSnapshot)
    ? oldSnapshot
        .map((p) => (p as { projectTitle?: string }).projectTitle)
        .join(', ')
    : '—';

  console.log(`\n🔄 Поток «${stream.title}» (${stream.uuid}):`);
  console.log(`   Было:  ${oldCount} проектов — ${oldTitles}`);
  console.log(`   Стало: ${projectCount} проектов`);

  if (dryRunFlag) {
    console.log(`\n🔍 РЕЖИМ DRY-RUN: файлы НЕ были изменены.`);
    return;
  }

  oldStream.contentSnapshot = newSnapshot;

  // ── Сохранение ──────────────────────────────────
  console.log(`\n💾 Записываю ${STREAMS_FILE}...`);
  await Bun.write(STREAMS_FILE, JSON.stringify(streams, null, 2));

  if (delta.hasConflict && syncStudentsFlag) {
    console.log(`💾 Записываю ${STUDENTS_FILE}...`);
    // Заменяем обновлённых студентов в общем массиве
    const streamStudentsMap = new Map(streamStudents.map((s) => [s.uuid, s]));
    const updatedAllStudents = students.map(
      (s) => streamStudentsMap.get(s.uuid) ?? s,
    );
    await Bun.write(STUDENTS_FILE, JSON.stringify(updatedAllStudents, null, 2));
  }

  console.log(`✅ Готово! Обновлён поток: ${selected.title}`);
}

main().catch((err) => {
  console.error('❌ Ошибка:', err.message || err);
  process.exit(1);
});
