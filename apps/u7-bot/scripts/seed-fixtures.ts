#!/usr/bin/env bun
/**
 * Скрипт dev-режима: материализует тестовый мир (по умолчанию core-education)
 * в директорию data/fixtures/.
 *
 * Поведение посева:
 *   - `bun run seed:fixtures` — материализует мир заново в data/fixtures/;
 *   - `WORLD=<имя> bun run seed:fixtures` — материализует указанный мир;
 *   - `KEEP_WORLD=1 bun run seed:fixtures` — если data/fixtures/ уже существует, посев пропускается.
 *
 * Использование:
 *   bun run apps/u7-bot/scripts/seed-fixtures.ts
 *   DB_DIR=./data/fixtures DEV_TELEGRAM_ID=<твой tg> \
 *     bun run apps/u7-bot/src/main.ts
 */

import { existsSync, rmSync } from 'node:fs';
import path from 'node:path';
import { seedWorldFixtures } from '../tests/worlds';

const DATA_DIR = path.resolve(import.meta.dir, '../../../data/fixtures');

function printRunHint() {
  console.log('');
  console.log('Запуск бота:');
  console.log(
    '  DB_DIR=./data/fixtures DEV_TELEGRAM_ID=<твой tg> bun run apps/u7-bot/src/main.ts',
  );
}

/** Карта ручных путей — что проверять каждой персоной. */
function printWorldGuide() {
  console.log(`
🎭 Персонажи (переключение: /persona <ключ> в чате бота):
  • guest  — любопытный гость: не зачислен ни в один поток,
             чистый взгляд с точки зрения нового посетителя;
  • dev    — ментор Потока 2 (и остальных): хаб → автопровод
             «Отзыв об Андрей» с уже написанным отзывом (перезапись ✏️);
             монитор потока → завершить Олега → событийная кампания
             → приглашение Олегу прилетит в чат → /persona oleg.
  • andrey — субъект живой c1: хаб → список S03 (Марина, Олег, Dev),
             2/3 отзывов уже есть (✅ и метрики «2 из 3»).
  • marina — завершившая студентка: живых кампаний нет (участник —
             адресат, не автор); S07 с отзывом о себе.
  • oleg   — одногруппник (not_advanced): адресат в списке Андрея;
             после завершения ментором — своя кампания-список.

Истёкшие кампании (заглушка окна): в хабе dev (c2, Поток 3) и
andrey (c4, Поток 3) — при открытии экран «окно закрыто».
Отзывы, написанные живьём, переживают перезапуски только с
KEEP_WORLD=1; обычный запуск сеет свежий мир.`);
}

async function main() {
  const worldName = process.env.WORLD ?? 'core-education';
  const keepWorld = process.env.KEEP_WORLD === '1';

  if (keepWorld && existsSync(DATA_DIR)) {
    console.log('🌍 KEEP_WORLD=1 — текущий мир сохранён, посев пропущен.');
    printRunHint();
    return;
  }

  console.log(
    keepWorld
      ? `🔧 KEEP_WORLD=1, но мира ещё нет — материализую мир "${worldName}"…`
      : `🔧 Материализую dev-мир "${worldName}" из тестовых миров (сохранить текущий: KEEP_WORLD=1)…`,
  );

  // По умолчанию — полный пересев: накопленные данные не переживают запуск.
  rmSync(DATA_DIR, { force: true, recursive: true });

  const manifest = await seedWorldFixtures({
    force: true,
    targetDir: DATA_DIR,
    worldName,
  });

  console.log(
    `✅ Мир "${manifest.name}" материализован в data/fixtures/ (хеш: ${manifest.hash}).`,
  );
  printRunHint();
  printWorldGuide();
}

main().catch((err) => {
  console.error('❌ Ошибка:', err);
  process.exit(1);
});
