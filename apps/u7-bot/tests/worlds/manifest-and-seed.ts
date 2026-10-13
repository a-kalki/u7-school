import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { computeSourceHash, materializeWorld } from './materializer';
import { listWorlds } from './registry';
import type { WorldManifest } from './types';

export interface SeedWorldOptions {
  worldName?: string;
  targetDir?: string;
  cacheDir?: string;
  force?: boolean;
}

export interface LoggerLike {
  info: (source: string, message: string) => void;
}

/**
 * Материализует фикстурный мир в целевую директорию (по умолчанию data/fixtures/)
 * и записывает туда world.json манифест.
 */
export async function seedWorldFixtures(
  options?: SeedWorldOptions,
): Promise<WorldManifest> {
  const worldName = options?.worldName ?? process.env.WORLD ?? 'core-education';
  const targetDir =
    options?.targetDir ?? path.resolve(process.cwd(), 'data/fixtures');

  const result = await materializeWorld(worldName, {
    cacheDir: options?.cacheDir,
    force: options?.force,
    targetDir,
  });

  return result.manifest;
}

/**
 * Возвращает отформатированный список зарегистрированных миров для вывода в консоль.
 */
export function formatWorldList(): string {
  const worlds = listWorlds();
  if (worlds.length === 0) {
    return 'Нет зарегистрированных тестовых миров.\n';
  }

  const lines = ['Доступные тестовые миры:', ''];
  for (const w of worlds) {
    const hash = computeSourceHash(w.definition);
    lines.push(`  • ${w.name} [хеш: ${hash}]`);
    if (w.definition.description) {
      lines.push(`    Описание: ${w.definition.description}`);
    }
  }
  lines.push('');
  return lines.join('\n');
}

/**
 * Проверяет наличие world.json в dbDir и логирует активный мир.
 * Не бросает исключений при отсутствии файла (безопасно для production).
 */
export async function logActiveWorldIfPresent(
  dbDir: string,
  logger: LoggerLike,
): Promise<boolean> {
  const manifestPath = path.join(dbDir, 'world.json');
  try {
    const raw = await readFile(manifestPath, 'utf-8');
    const manifest = JSON.parse(raw) as WorldManifest;
    if (manifest?.name && manifest?.hash) {
      logger.info(
        'main',
        `[world] Активный мир: ${manifest.name} (хеш: ${manifest.hash})`,
      );
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
