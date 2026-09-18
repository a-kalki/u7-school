import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Role, type User } from '@u7-scl/app';
import { InProcJobScheduler } from '@u7-scl/core/infra';
import { ConsoleLogger } from '@u7-scl/core/shared';
import * as v from 'valibot';
import { type BotConfig, BotConfigSchema } from './config';
import { createApiApp } from './create-api-app';

/** Актор для UC с requiresAuth: checkAuth проверяет только наличие. */
const ACTOR: User = {
  uuid: '22222222-2222-4222-8222-222222222222',
  name: 'Тестовый актор',
  telegramId: 1,
  roles: [Role.STUDENT],
  createdAt: '2026-06-01T00:00',
};

/** Минимальный конфиг для сборки приложения (токены бота не используются). */
function makeConfig(dbDir: string): BotConfig {
  return v.parse(BotConfigSchema, {
    botToken: 'test-token',
    schoolGroupUrl: 'https://t.me/test',
    schoolGroupId: 1,
    botAdminUuid: '99999999-9999-4999-8999-999999999999',
    dbDir,
  });
}

describe('create-api-app (smoke: сборка с модулем peer-review)', () => {
  let dir: string;

  beforeAll(async () => {
    dir = await mkdtemp(join(tmpdir(), 'u7-api-app-'));
  });

  afterAll(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  test('приложение собирается: модуль peer-review зарегистрирован', () => {
    const bundle = createApiApp(makeConfig(dir), new ConsoleLogger());

    const module = bundle.apiApp.getModule('peer-review');
    expect(module).toBeDefined();
    expect(bundle.peerReviewFacade).toBeDefined();
  });

  test('init(): подписка ER проходит, query-UC модуля отвечает', async () => {
    const bundle = createApiApp(makeConfig(dir), new ConsoleLogger());
    bundle.apiApp.init(new InProcJobScheduler({ logger: new ConsoleLogger() }));

    // Модуль init() подписал ER create-student-campaign на события судьбы
    // студента; пользовательский UC доступен через единый вход приложения
    const campaigns = await bundle.apiApp.execute(
      'get-my-campaigns',
      { userId: '11111111-1111-4111-8111-111111111111', onlyLives: true },
      ACTOR,
    );
    expect(campaigns).toEqual([]);
  });
});
