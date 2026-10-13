import type { WorldFixturePaths } from '../worlds';
import { cleanupWorldFixtures, getWorldFixtures } from '../worlds';

/** Пути к скопированным фикстурам */
export type FixturePaths = WorldFixturePaths;

/**
 * Загружает фикстуры во временную директорию (copy-on-write) из кеша материализации мира.
 * Источник — мир `core-education` по умолчанию или указанный мир.
 *
 * @param tag — метка для временной директории (имя describe-блока)
 * @param worldName — имя тестового мира (по умолчанию 'core-education')
 * @returns объект с путями к скопированным файлам
 */
export async function loadFixtures(
  tag?: string,
  worldName = 'core-education',
): Promise<FixturePaths> {
  return getWorldFixtures(worldName, tag);
}

/**
 * Удаляет временную директорию с фикстурами мира.
 * Не удаляет, если установлена переменная KEEP_FIXTURES=1.
 */
export async function cleanupFixtures(fixtures: FixturePaths): Promise<void> {
  return cleanupWorldFixtures(fixtures);
}
