import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { buildWorldState } from './builder';
import { getWorld } from './registry';
import type { WorldDefinition, WorldManifest, WorldState } from './types';

/** Интерфейс путей к фикстурам мира, совместимый с FixturePaths */
export interface WorldFixturePaths {
  /** Корень директории с фикстурами */
  dbDir: string;
  /** Путь к users.json */
  users: string;
  /** Путь к streams.json */
  streams: string;
  /** Путь к students.json */
  students: string;
  /** Пути к файлам курсов */
  courses: {
    modules: string;
    lessons: string;
    steps: string;
    courses: string;
  };
  /** Пути к файлам peer-review */
  peerReview: {
    campaigns: string;
    reviews: string;
  };
  /** Путь к манифесту world.json */
  manifest: string;
}

/** Результат материализации мира */
export interface WorldMaterializationResult {
  /** Корневая директория материализованного мира */
  dbDir: string;
  /** Манифест мира */
  manifest: WorldManifest;
  /** Пути к файлам данных */
  paths: WorldFixturePaths;
  /** Взят ли результат из кеша без повторной сборки */
  wasCached: boolean;
}

/** Опции материализации мира */
export interface MaterializeOptions {
  /** Базовая директория кеша миров (по умолчанию .cache/worlds) */
  cacheDir?: string;
  /** Принудительная пересборка с игнорированием существующего кеша */
  force?: boolean;
  /** Целевая директория для выгрузки (если указана, файлы копируются туда) */
  targetDir?: string;
  /** Метка (тег) теста для изолированной копии */
  tag?: string;
}

const DEFAULT_CACHE_DIR = path.resolve(process.cwd(), '.cache/worlds');

/**
 * Вычисляет стабильный SHA-256 хеш от исходников/определения мира (первые 16 символов).
 */
export function computeSourceHash(def: WorldDefinition): string {
  // Каноническая сериализация с сортировкой ключей
  const canonicalString = JSON.stringify(def, Object.keys(def).sort());
  return createHash('sha256')
    .update(canonicalString)
    .digest('hex')
    .slice(0, 16);
}

/**
 * Строит объект путей WorldFixturePaths для заданной директории базы данных.
 */
export function getPathsForDbDir(dbDir: string): WorldFixturePaths {
  return {
    dbDir,
    users: path.join(dbDir, 'users.json'),
    streams: path.join(dbDir, 'streams.json'),
    students: path.join(dbDir, 'students.json'),
    courses: {
      courses: path.join(dbDir, 'courses', 'courses.json'),
      modules: path.join(dbDir, 'courses', 'modules.json'),
      lessons: path.join(dbDir, 'courses', 'lessons.json'),
      steps: path.join(dbDir, 'courses', 'steps.json'),
    },
    peerReview: {
      campaigns: path.join(dbDir, 'peer-review', 'campaigns.json'),
      reviews: path.join(dbDir, 'peer-review', 'reviews.json'),
    },
    manifest: path.join(dbDir, 'world.json'),
  };
}

/**
 * Записывает WorldState на диск в виде JSON файлов.
 */
async function writeWorldFiles(
  targetDir: string,
  state: WorldState,
  manifest: WorldManifest,
): Promise<void> {
  await mkdir(path.join(targetDir, 'courses'), { recursive: true });
  await mkdir(path.join(targetDir, 'peer-review'), { recursive: true });
  await mkdir(path.join(targetDir, 'wish'), { recursive: true });
  await mkdir(path.join(targetDir, 'questionnaires'), { recursive: true });
  await mkdir(path.join(targetDir, 'bot'), { recursive: true });

  const paths = getPathsForDbDir(targetDir);

  await writeFile(paths.users, JSON.stringify(state.users, null, 2), 'utf-8');
  await writeFile(
    paths.streams,
    JSON.stringify(state.streams, null, 2),
    'utf-8',
  );
  await writeFile(
    paths.students,
    JSON.stringify(state.students, null, 2),
    'utf-8',
  );

  await writeFile(
    paths.courses.courses,
    JSON.stringify(state.courses, null, 2),
    'utf-8',
  );
  await writeFile(
    paths.courses.modules,
    JSON.stringify(state.modules, null, 2),
    'utf-8',
  );
  await writeFile(
    paths.courses.lessons,
    JSON.stringify(state.lessons, null, 2),
    'utf-8',
  );
  await writeFile(
    paths.courses.steps,
    JSON.stringify(state.steps, null, 2),
    'utf-8',
  );

  await writeFile(
    paths.peerReview.campaigns,
    JSON.stringify(state.campaigns, null, 2),
    'utf-8',
  );
  await writeFile(
    paths.peerReview.reviews,
    JSON.stringify(state.reviews, null, 2),
    'utf-8',
  );

  await writeFile(
    path.join(targetDir, 'wish', 'wishes.json'),
    JSON.stringify(state.wishes ?? [], null, 2),
    'utf-8',
  );
  await writeFile(
    path.join(targetDir, 'questionnaires', 'questionnaires.json'),
    JSON.stringify(state.questionnaires ?? [], null, 2),
    'utf-8',
  );
  await writeFile(
    path.join(targetDir, 'questionnaires', 'responses.json'),
    '[]\n',
    'utf-8',
  );

  await writeFile(
    path.join(targetDir, 'bot', 'sessions.json'),
    JSON.stringify(state.sessions ?? [], null, 2),
    'utf-8',
  );
  await writeFile(
    path.join(targetDir, 'bot', 'short-ids.json'),
    JSON.stringify(state.shortIds ?? [], null, 2),
    'utf-8',
  );

  await writeFile(paths.manifest, JSON.stringify(manifest, null, 2), 'utf-8');
}

/**
 * Материализует мир с поддержкой кеширования по имени и хешу исходников.
 */
export async function materializeWorld(
  worldOrName: string | WorldDefinition,
  options?: MaterializeOptions,
): Promise<WorldMaterializationResult> {
  const def =
    typeof worldOrName === 'string' ? getWorld(worldOrName) : worldOrName;
  if (!def) {
    throw new Error(`Мир "${String(worldOrName)}" не найден в реестре`);
  }
  const worldName = def.name ?? 'world';
  const sourceHash = computeSourceHash(def);
  const cacheBaseDir = options?.cacheDir ?? DEFAULT_CACHE_DIR;
  const cacheKey = `${worldName}-${sourceHash}`;
  const cachedDir = path.join(cacheBaseDir, cacheKey);
  const manifestPath = path.join(cachedDir, 'world.json');

  let wasCached = false;
  let manifest: WorldManifest | null = null;

  if (!options?.force) {
    try {
      const existingRaw = await readFile(manifestPath, 'utf-8');
      const existing = JSON.parse(existingRaw) as WorldManifest;
      if (existing.hash === sourceHash && existing.name === worldName) {
        manifest = existing;
        wasCached = true;
      }
    } catch {
      wasCached = false;
    }
  }

  if (!wasCached || !manifest) {
    const state = buildWorldState(def);
    manifest = {
      name: worldName,
      hash: sourceHash,
      generatedAt: new Date().toISOString(),
      sourceHash,
    };
    await writeWorldFiles(cachedDir, state, manifest);
  }

  // Если запрошена выгрузка в целевую директорию targetDir
  if (options?.targetDir) {
    await mkdir(options.targetDir, { recursive: true });
    await cp(cachedDir, options.targetDir, { recursive: true });
    return {
      dbDir: options.targetDir,
      manifest,
      paths: getPathsForDbDir(options.targetDir),
      wasCached,
    };
  }

  return {
    dbDir: cachedDir,
    manifest,
    paths: getPathsForDbDir(cachedDir),
    wasCached,
  };
}

/**
 * Создаёт изолированную временную копию фикстур мира (copy-on-write) для изолированного теста.
 * Наследует механизм fixture-loader.
 */
export async function getWorldFixtures(
  worldOrName: string | WorldDefinition = 'core-education',
  tag?: string,
  options?: MaterializeOptions,
): Promise<WorldFixturePaths> {
  const def =
    typeof worldOrName === 'string' ? getWorld(worldOrName) : worldOrName;
  if (!def) {
    throw new Error(`Мир "${String(worldOrName)}" не найден в реестре`);
  }
  const materialized = await materializeWorld(def, options);

  const worldName =
    typeof worldOrName === 'string'
      ? worldOrName
      : (worldOrName.name ?? 'world');
  const safeTag = tag ? `-${tag.replace(/[^a-z0-9]/gi, '-')}` : '';
  const tmpDir = path.join(
    '/tmp',
    `u7-world-${worldName}${safeTag}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  );

  await mkdir(tmpDir, { recursive: true });
  await cp(materialized.dbDir, tmpDir, { recursive: true });

  return getPathsForDbDir(tmpDir);
}

/**
 * Удаляет временную директорию с фикстурами мира, если не выставлен KEEP_FIXTURES=1.
 */
export async function cleanupWorldFixtures(
  fixtures: WorldFixturePaths,
): Promise<void> {
  if (process.env.KEEP_FIXTURES === '1') {
    return;
  }
  try {
    await rm(fixtures.dbDir, { recursive: true, force: true });
  } catch {
    // Игнорируем ошибки удаления
  }
}
