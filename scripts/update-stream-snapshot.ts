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

import { createApp } from './_app-factory';

const STREAMS_FILE = 'data/streams/streams.json';

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

  // ── Выбор потока ────────────────────────────────
  const explicitId = process.argv[2];
  let selected: StreamInfo | undefined;

  if (explicitId) {
    selected = allStreams.find((s) => s.uuid === explicitId);
    if (!selected) {
      console.error(`❌ Поток с uuid=${explicitId} не найден.`);
      console.log('Доступные потоки:');
      for (const s of allStreams) {
        console.log(`   ${s.uuid}  ${s.title} (${s.status}, ${s.projectCount} проектов)`);
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

  // ── Получение свежего снапшота ──────────────────
  console.log(`\n📦 Поднимаю приложение...`);
  const app = createApp(true);

  console.log(
    `🔍 Получаю снапшот модуля ${selected.moduleId} (поток «${selected.title}»)...`,
  );
  const newSnapshot = await app.execute('get-module-snapshot', {
    moduleId: selected.moduleId,
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

  // ── Обновление ТОЛЬКО выбранного потока ─────────
  const oldSnapshot = streams[selected.index].contentSnapshot as Array<{
    projectTitle: string;
  }>;
  const oldCount = Array.isArray(oldSnapshot) ? oldSnapshot.length : 0;
  const oldTitles = Array.isArray(oldSnapshot)
    ? oldSnapshot.map((p) => p.projectTitle).join(', ')
    : '—';

  console.log(`\n🔄 Поток «${selected.title}» (${selected.uuid}):`);
  console.log(`   Было:  ${oldCount} проектов — ${oldTitles}`);
  console.log(`   Стало: ${projectCount} проектов`);

  streams[selected.index].contentSnapshot = newSnapshot;

  // ── Сохранение ──────────────────────────────────
  console.log(`\n💾 Записываю ${STREAMS_FILE}...`);
  await Bun.write(STREAMS_FILE, JSON.stringify(streams, null, 2));

  console.log(`✅ Готово! Обновлён поток: ${selected.title}`);
}

main().catch((err) => {
  console.error('❌ Ошибка:', err.message || err);
  process.exit(1);
});
