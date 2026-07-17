/**
 * update-stream-snapshot — обновляет contentSnapshot у потоков указанного модуля.
 *
 * Использование:
 *   bun run scripts/update-stream-snapshot.ts
 *
 * Скрипт выводит список активных потоков, пользователь выбирает номер —
 * и снапшот выбранного потока обновляется из актуальных данных модуля.
 *
 * Можно также указать moduleId явно:
 *   bun run scripts/update-stream-snapshot.ts e4dea4fc-f8db-4b19-be2d-59fcf3ad96fa
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

  const activeStreams: StreamInfo[] = [];
  for (let i = 0; i < streams.length; i++) {
    const s = streams[i]!;
    if (s.status !== 'active') continue;
    const snap = s.contentSnapshot as Array<{ lessons: unknown[] }> | undefined;
    activeStreams.push({
      index: i,
      uuid: s.uuid as string,
      title: s.title as string,
      moduleId: s.moduleId as string,
      status: s.status as string,
      projectCount: snap?.length ?? 0,
    });
  }

  if (activeStreams.length === 0) {
    console.log('Нет активных потоков.');
    return;
  }

  // ── Выбор потока ────────────────────────────────
  let moduleId: string;

  const explicitId = process.argv[2];
  if (explicitId) {
    moduleId = explicitId;
  } else {
    console.log('Активные потоки:\n');
    for (const s of activeStreams) {
      console.log(
        `  [${s.index + 1}] ${s.title}  (${s.projectCount} проектов)  ${s.uuid}`,
      );
    }

    console.log();
    const input = prompt('Выбери номер потока (или Enter — выйти):');
    if (!input?.trim()) {
      console.log('Выход.');
      return;
    }

    const choice = Number.parseInt(input.trim(), 10);
    const selected = activeStreams.find((s) => s.index + 1 === choice);
    if (!selected) {
      console.log(`Нет потока с номером ${choice}.`);
      return;
    }

    moduleId = selected.moduleId;
  }

  // ── Получение свежего снапшота ──────────────────
  console.log(`\n📦 Поднимаю приложение...`);
  const app = createApp(true);

  console.log(`🔍 Получаю снапшот модуля ${moduleId}...`);
  const newSnapshot = await app.execute('get-module-snapshot', { moduleId });

  const projectCount = newSnapshot.length;
  const lessonCount = newSnapshot.reduce(
    (sum, p) => sum + p.lessons.length,
    0,
  );
  const stepCount = newSnapshot.reduce(
    (sum, p) => sum + p.lessons.reduce((s, l) => s + l.stepIds.length, 0),
    0,
  );
  console.log(`   ${projectCount} проектов, ${lessonCount} уроков, ${stepCount} шагов:`);
  for (const p of newSnapshot) {
    console.log(`     • ${p.projectTitle} (${p.lessons.length} уроков)`);
  }

  // ── Обновление потоков ──────────────────────────
  let updatedCount = 0;
  for (const stream of streams) {
    if (stream.moduleId !== moduleId) continue;

    const oldSnapshot = stream.contentSnapshot as Array<{ projectTitle: string }>;
    const oldCount = Array.isArray(oldSnapshot) ? oldSnapshot.length : 0;
    const oldTitles = Array.isArray(oldSnapshot)
      ? oldSnapshot.map((p) => p.projectTitle).join(', ')
      : '—';

    console.log(
      `\n🔄 Поток «${stream.title}» (${stream.uuid}):`,
    );
    console.log(`   Было:  ${oldCount} проектов — ${oldTitles}`);
    console.log(`   Стало: ${projectCount} проектов`);

    stream.contentSnapshot = newSnapshot;
    updatedCount++;
  }

  if (updatedCount === 0) {
    console.log(`\n⚠️  Нет потоков с moduleId=${moduleId}.`);
    return;
  }

  // ── Сохранение ──────────────────────────────────
  console.log(`\n💾 Записываю ${STREAMS_FILE}...`);
  await Bun.write(STREAMS_FILE, JSON.stringify(streams, null, 2));

  console.log(`✅ Готово! Обновлено потоков: ${updatedCount}`);
}

main().catch((err) => {
  console.error('❌ Ошибка:', err.message || err);
  process.exit(1);
});
