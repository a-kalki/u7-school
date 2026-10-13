import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { Role } from '@u7-scl/user/domain';
import {
  formatWorldList,
  logActiveWorldIfPresent,
  seedWorldFixtures,
} from './manifest-and-seed';
import { registerWorld } from './registry';
import type { WorldDefinition, WorldManifest } from './types';

const TEST_TARGET_DIR = path.join('/tmp', 'u7-test-seed-target');
const TEST_CACHE_DIR = path.join('/tmp', 'u7-test-seed-cache');

const testWorldDef: WorldDefinition = {
  name: 'test-seed-world',
  description: 'Мир для проверки seed и манифеста',
  persons: [
    {
      key: 'u-seed',
      name: 'Seed Person',
      telegramId: 99911,
      roles: [Role.GUEST],
      registeredAt: 'T-1d',
    },
  ],
};

describe('Манифест world.json, seed и логирование мира', () => {
  beforeEach(async () => {
    await rm(TEST_TARGET_DIR, { force: true, recursive: true });
    await rm(TEST_CACHE_DIR, { force: true, recursive: true });
    registerWorld('test-seed-world', testWorldDef);
  });

  afterEach(async () => {
    await rm(TEST_TARGET_DIR, { force: true, recursive: true });
    await rm(TEST_CACHE_DIR, { force: true, recursive: true });
  });

  it('seedWorldFixtures создаёт data/fixtures с world.json манифестом (name, hash)', async () => {
    const manifest = await seedWorldFixtures({
      cacheDir: TEST_CACHE_DIR,
      targetDir: TEST_TARGET_DIR,
      worldName: 'test-seed-world',
    });

    expect(manifest.name).toBe('test-seed-world');
    expect(manifest.hash).toBeString();

    const manifestOnDiskRaw = await readFile(
      path.join(TEST_TARGET_DIR, 'world.json'),
      'utf-8',
    );
    const manifestOnDisk = JSON.parse(manifestOnDiskRaw) as WorldManifest;
    expect(manifestOnDisk.name).toBe('test-seed-world');
    expect(manifestOnDisk.hash).toBe(manifest.hash);
  });

  it('seedWorldFixtures применяет core-education по умолчанию, если WORLD не задан', async () => {
    const manifest = await seedWorldFixtures({
      cacheDir: TEST_CACHE_DIR,
      targetDir: TEST_TARGET_DIR,
    });

    expect(manifest.name).toBe('core-education');
  });

  it('formatWorldList возвращает форматированный список всех зарегистрированных миров', () => {
    const listOutput = formatWorldList();
    expect(listOutput).toContain('test-seed-world');
    expect(listOutput).toContain('Мир для проверки seed и манифеста');
  });

  it('logActiveWorldIfPresent логирует активный мир при наличии world.json', async () => {
    await seedWorldFixtures({
      cacheDir: TEST_CACHE_DIR,
      targetDir: TEST_TARGET_DIR,
      worldName: 'test-seed-world',
    });

    const logs: string[] = [];
    const mockLogger = {
      info: (_source: string, message: string) => {
        logs.push(message);
      },
    };

    const found = await logActiveWorldIfPresent(TEST_TARGET_DIR, mockLogger);
    expect(found).toBe(true);
    expect(logs.length).toBe(1);
    expect(logs[0]).toContain('[world] Активный мир: test-seed-world');
  });

  it('logActiveWorldIfPresent возвращает false и не падает, если world.json отсутствует', async () => {
    const logs: string[] = [];
    const mockLogger = {
      info: (_source: string, message: string) => {
        logs.push(message);
      },
    };

    const found = await logActiveWorldIfPresent(
      '/tmp/empty-dir-no-world',
      mockLogger,
    );
    expect(found).toBe(false);
    expect(logs.length).toBe(0);
  });
});
