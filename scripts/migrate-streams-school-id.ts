/**
 * migrate-streams-school-id.ts — идемпотентная миграция schoolId для потоков.
 *
 * Проставляет schoolId (по умолчанию U7_SCHOOL_ID) существующим потокам в streams.json.
 *
 * ⚠️ ВАЖНО (перед выполнением на проде):
 * 1. Бот должен быть ОСТАНОВЛЕН (pm2 stop u7-bot).
 * 2. Сделать бэкап: `bun run backup before-migration`.
 * 3. Запустить миграцию: `bun run scripts/migrate-streams-school-id.ts`.
 * 4. Запустить бота: `pm2 start ...`.
 *
 * На работающем старом коде запускать нельзя: valibot при чтении/записи
 * отбрасывает неизвестные поля и затрёт schoolId.
 *
 * Использование:
 *   bun run scripts/migrate-streams-school-id.ts
 *   DB_DIR=./data/fixtures bun run scripts/migrate-streams-school-id.ts
 */

import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { U7_SCHOOL_ID } from '@u7-scl/app/domain';

export interface MigrateResult {
  total: number;
  migrated: number;
  alreadyHadSchoolId: number;
}

/**
 * Идемпотентно обновляет массив потоков, добавляя schoolId отсутствующим.
 */
export function migrateStreamsData(
  streams: Array<Record<string, unknown>>,
  schoolId: string = U7_SCHOOL_ID,
): { updatedStreams: Array<Record<string, unknown>>; result: MigrateResult } {
  let migrated = 0;
  let alreadyHadSchoolId = 0;

  const updatedStreams = streams.map((s) => {
    if (typeof s.schoolId === 'string' && s.schoolId.trim() !== '') {
      alreadyHadSchoolId++;
      return s;
    }

    migrated++;
    return {
      ...s,
      schoolId,
    };
  });

  return {
    updatedStreams,
    result: {
      total: streams.length,
      migrated,
      alreadyHadSchoolId,
    },
  };
}

/**
 * Определяет реальный путь к файлу streams.json внутри DB_DIR.
 */
export function resolveStreamsFilePath(dbDir: string): string {
  const nested = path.join(dbDir, 'streams', 'streams.json');
  if (existsSync(nested)) return nested;

  const flat = path.join(dbDir, 'streams.json');
  if (existsSync(flat)) return flat;

  // По умолчанию возвращаем nested путь
  return nested;
}

export async function runMigration(dbDir: string): Promise<MigrateResult> {
  const filePath = resolveStreamsFilePath(dbDir);

  if (!existsSync(filePath)) {
    console.log(`ℹ️ Файл потоков не найден: ${filePath}`);
    return { total: 0, migrated: 0, alreadyHadSchoolId: 0 };
  }

  const raw = await readFile(filePath, 'utf-8');
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    throw new Error(`Не удалось распарсить JSON файл ${filePath}: ${err}`);
  }

  if (!Array.isArray(data)) {
    throw new Error(
      `Файл ${filePath} содержит некорректный формат: ожидался массив потоков.`,
    );
  }

  const { updatedStreams, result } = migrateStreamsData(
    data as Array<Record<string, unknown>>,
  );

  if (result.migrated > 0) {
    await writeFile(filePath, JSON.stringify(updatedStreams, null, 2), 'utf-8');
    console.log(
      `✅ Миграция выполнена для ${filePath}: обновлено ${result.migrated} из ${result.total} потоков.`,
    );
  } else {
    console.log(
      `ℹ️ Миграция не требуется для ${filePath}: все потоки (${result.total}) уже содержат schoolId.`,
    );
  }

  return result;
}

if (import.meta.main) {
  const dbDir = process.env.DB_DIR || 'data';
  console.log(
    `🚀 Запуск миграции schoolId для потоков (каталог данных: ${dbDir})...`,
  );

  runMigration(dbDir)
    .then((result) => {
      console.log('🎉 Готово:', result);
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Ошибка миграции:', err);
      process.exit(1);
    });
}
