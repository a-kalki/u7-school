#!/usr/bin/env bun
/**
 * Валидатор тестовых миров.
 * Собирает мир, проверяет все инварианты, печатает нарушения и возвращает ненулевой exit при ошибках.
 *
 * Использование:
 *   bun run apps/u7-bot/scripts/world-check.ts [worldName]
 *   WORLD=core-education bun run world:check
 */

import { checkWorld, getWorld, listWorlds } from '../tests/worlds';

async function main() {
  const worldArg = process.argv[2] || process.env.WORLD;

  // Если указан конкретный мир
  if (worldArg) {
    const worldDef = getWorld(worldArg);
    if (!worldDef) {
      console.error(
        `❌ Мир "${worldArg}" не найден в реестре. Доступные миры: ${listWorlds().join(', ') || 'нет зарегистрированных'}`,
      );
      process.exit(1);
    }

    const result = checkWorld(worldDef);
    process.exit(result.valid ? 0 : 1);
  }

  // Если мир не указан, проверяем все зарегистрированные миры
  const allNames = listWorlds();
  if (allNames.length === 0) {
    console.log('ℹ️ В реестре пока нет зарегистрированных миров.');
    process.exit(0);
  }

  let hasErrors = false;
  for (const name of allNames) {
    const worldDef = getWorld(name);
    if (worldDef) {
      console.log(`\n🔍 Проверка мира: "${name}"...`);
      const result = checkWorld(worldDef);
      if (!result.valid) {
        hasErrors = true;
      }
    }
  }

  process.exit(hasErrors ? 1 : 0);
}

main().catch((err) => {
  console.error('Непредвиденная ошибка валидатора миров:', err);
  process.exit(1);
});
