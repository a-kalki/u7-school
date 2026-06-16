import { copyFile, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';

/** Путь к неизменяемым шаблонам фикстур */
const TEMPLATES_DIR = path.resolve(import.meta.dir, '../fixtures/templates');

/** Пути к скопированным фикстурам */
export interface FixturePaths {
  /** Корень временной директории с фикстурами */
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
  };
}

/**
 * Загружает фикстуры во временную директорию (copy-on-write).
 * Шаблоны в templates/ остаются неизменными.
 *
 * @param tag — метка для временной директории (имя describe-блока)
 * @returns объект с путями к скопированным файлам
 */
export async function loadFixtures(tag?: string): Promise<FixturePaths> {
  const suffix = tag ? `-${tag.replace(/[^a-z0-9]/gi, '-')}` : '';
  const tmpDir = path.join('/tmp', `u7-bot-e2e-${Date.now()}${suffix}`);

  return copyTemplates(tmpDir);
}

/**
 * Удаляет временную директорию с фикстурами.
 * Не удаляет, если установлена переменная KEEP_FIXTURES=1.
 */
export async function cleanupFixtures(fixtures: FixturePaths): Promise<void> {
  if (process.env.KEEP_FIXTURES === '1') {
    console.log(
      `[fixture-loader] KEEP_FIXTURES=1 — сохраняем: ${fixtures.dbDir}`,
    );
    return;
  }
  try {
    await rm(fixtures.dbDir, { recursive: true, force: true });
  } catch {
    // Игнорируем ошибки удаления (файлы могут быть заняты)
  }
}

/**
 * Копирует все файлы из TEMPLATES_DIR в tmpDir.
 */
async function copyTemplates(tmpDir: string): Promise<FixturePaths> {
  // Корневые JSON-файлы
  const usersSrc = path.join(TEMPLATES_DIR, 'users.json');
  const streamsSrc = path.join(TEMPLATES_DIR, 'streams.json');
  const studentsSrc = path.join(TEMPLATES_DIR, 'students.json');

  // Поддиректория courses
  const coursesTmp = path.join(tmpDir, 'courses');
  const coursesSrc = path.join(TEMPLATES_DIR, 'courses');

  await mkdir(tmpDir, { recursive: true });
  await mkdir(coursesTmp, { recursive: true });

  // Копируем корневые файлы
  await copyFile(usersSrc, path.join(tmpDir, 'users.json'));
  await copyFile(streamsSrc, path.join(tmpDir, 'streams.json'));
  await copyFile(studentsSrc, path.join(tmpDir, 'students.json'));

  // Копируем файлы курсов
  await copyFile(
    path.join(coursesSrc, 'modules.json'),
    path.join(coursesTmp, 'modules.json'),
  );
  await copyFile(
    path.join(coursesSrc, 'lessons.json'),
    path.join(coursesTmp, 'lessons.json'),
  );
  await copyFile(
    path.join(coursesSrc, 'steps.json'),
    path.join(coursesTmp, 'steps.json'),
  );

  if (process.env.KEEP_FIXTURES === '1') {
    console.log(`[fixture-loader] Фикстуры скопированы в: ${tmpDir}`);
  }

  return {
    dbDir: tmpDir,
    users: path.join(tmpDir, 'users.json'),
    streams: path.join(tmpDir, 'streams.json'),
    students: path.join(tmpDir, 'students.json'),
    courses: {
      modules: path.join(coursesTmp, 'modules.json'),
      lessons: path.join(coursesTmp, 'lessons.json'),
      steps: path.join(coursesTmp, 'steps.json'),
    },
  };
}
