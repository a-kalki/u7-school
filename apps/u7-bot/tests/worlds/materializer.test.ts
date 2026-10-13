import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { StreamStatus } from '@u7-scl/stream/domain';
import { Role } from '@u7-scl/user/domain';
import {
  cleanupWorldFixtures,
  computeSourceHash,
  getWorldFixtures,
  materializeWorld,
} from './materializer';
import type { WorldDefinition } from './types';

const TEST_CACHE_DIR = path.join('/tmp', 'u7-test-worlds-cache');

const sampleWorldDef1: WorldDefinition = {
  name: 'test-sample',
  description: 'Пример тестового мира 1',
  persons: [
    {
      key: 'u1',
      name: 'Пользователь 1',
      telegramId: 1001,
      roles: [Role.MENTOR],
      registeredAt: 'T-10d',
    },
  ],
  streams: [
    {
      key: 's1',
      title: 'Поток 1',
      description: 'Тестовый поток',
      courseKey: 'c1',
      mentorKey: 'u1',
      status: StreamStatus.ACTIVE,
      startedAt: 'T-5d',
    },
  ],
};

const sampleWorldDef2Modified: WorldDefinition = {
  ...sampleWorldDef1,
  description: 'Модифицированный тестовый мир',
};

describe('Материализатор и кеш миров (World Materializer)', () => {
  beforeEach(async () => {
    await rm(TEST_CACHE_DIR, { recursive: true, force: true });
  });

  afterEach(async () => {
    await rm(TEST_CACHE_DIR, { recursive: true, force: true });
  });

  it('вычисляет детерминированный sourceHash от определения мира', () => {
    const hash1 = computeSourceHash(sampleWorldDef1);
    const hash2 = computeSourceHash(sampleWorldDef1);
    const hash3 = computeSourceHash(sampleWorldDef2Modified);

    expect(hash1).toBeString();
    expect(hash1.length).toBe(16);
    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hash3);
  });

  it('первый вызов материализует мир в кеш (wasCached: false)', async () => {
    const res1 = await materializeWorld(sampleWorldDef1, {
      cacheDir: TEST_CACHE_DIR,
    });

    expect(res1.wasCached).toBe(false);
    expect(res1.manifest.name).toBe('test-sample');
    expect(res1.manifest.hash).toBe(computeSourceHash(sampleWorldDef1));

    // Проверяем наличие сгенерированных файлов
    const usersContent = await readFile(res1.paths.users, 'utf-8');
    const users = JSON.parse(usersContent);
    expect(users).toBeArray();
    expect(users.length).toBe(1);
    expect(users[0].name).toBe('Пользователь 1');
  });

  it('повторный запрос без изменений мира не пересобирает (wasCached: true)', async () => {
    const res1 = await materializeWorld(sampleWorldDef1, {
      cacheDir: TEST_CACHE_DIR,
    });
    expect(res1.wasCached).toBe(false);

    const res2 = await materializeWorld(sampleWorldDef1, {
      cacheDir: TEST_CACHE_DIR,
    });
    expect(res2.wasCached).toBe(true);
    expect(res2.manifest.hash).toBe(res1.manifest.hash);
    expect(res2.dbDir).toBe(res1.dbDir);
  });

  it('правка исходников (изменение определения) приводит к пересборке с новым хешем', async () => {
    const res1 = await materializeWorld(sampleWorldDef1, {
      cacheDir: TEST_CACHE_DIR,
    });
    expect(res1.wasCached).toBe(false);

    const res2 = await materializeWorld(sampleWorldDef2Modified, {
      cacheDir: TEST_CACHE_DIR,
    });
    expect(res2.wasCached).toBe(false);
    expect(res2.manifest.hash).not.toBe(res1.manifest.hash);
  });

  it('copy-on-write раздача копий по тегу: копии изолированы друг от друга и от кеша', async () => {
    const copy1 = await getWorldFixtures(sampleWorldDef1, 'tag-a', {
      cacheDir: TEST_CACHE_DIR,
    });
    const copy2 = await getWorldFixtures(sampleWorldDef1, 'tag-b', {
      cacheDir: TEST_CACHE_DIR,
    });

    expect(copy1.dbDir).not.toBe(copy2.dbDir);

    // Модифицируем файл в copy1
    const modifiedUsers = [{ uuid: 'mod-1', name: 'Изолированный' }];
    await writeFile(copy1.users, JSON.stringify(modifiedUsers));

    // Проверяем, что в copy2 данные не изменились
    const copy2Users = JSON.parse(await readFile(copy2.users, 'utf-8'));
    expect(copy2Users[0].name).toBe('Пользователь 1');

    // Очищаем фикстуры
    await cleanupWorldFixtures(copy1);
    await cleanupWorldFixtures(copy2);
  });
});
