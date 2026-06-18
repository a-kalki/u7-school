import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import { AppController } from '@u7-scl/app/ui';
import { BotRouter } from '@u7-scl/core/ui';
import { StreamController } from '@u7-scl/stream/ui/bot/controller/stream-controller';
import type { TestApp } from '../../helpers/test-app';
import { createTestApp } from '../../helpers/test-app';

/**
 * US: Кнопка «Сообщество школы» в главном меню.
 * Проверяет, что AppController корректно добавляет кнопку.
 *
 * Покрытие:
 * - Гость → видит кнопку «Сообщество школы»
 * - Студент → видит
 * - Ментор → видит
 * - Кнопка имеет низкий приоритет (после основных пунктов)
 * - Без schoolGroupUrl кнопка не добавляется
 */
describe('CommunityStory integration (app-controller)', () => {
  const SCHOOL_GROUP_URL = 'https://t.me/u7_school_group';
  let app: TestApp;
  let guest: User;
  let student: User;
  let mentor: User;

  beforeAll(async () => {
    app = await createTestApp('community-app');
    guest = (await app.userFacade.getUserByTelegramId(1001))!;
    student = (await app.userFacade.getUserByTelegramId(1003))!;
    mentor = (await app.userFacade.getUserByTelegramId(1004))!;
  });

  afterAll(async () => {
    await app.cleanup();
  });

  function makeRouter(schoolGroupUrl?: string): BotRouter {
    const streamController = new StreamController(app.streamModule);
    streamController.init(app.apiApp);
    const appController = new AppController(schoolGroupUrl);
    appController.init(app.apiApp);
    return new BotRouter([appController, streamController]);
  }

  test('кнопка «Сообщество школы» доступна гостю', async () => {
    const router = makeRouter(SCHOOL_GROUP_URL);
    const items = await router.collectMainMenu(guest);
    const communityBtn = items.find((i) => i.text === '💬 Сообщество школы');
    expect(communityBtn).toBeDefined();
    expect(communityBtn!.kind).toBe('url');
    expect((communityBtn as any).url).toBe(SCHOOL_GROUP_URL);
  });

  test('кнопка «Сообщество школы» доступна студенту', async () => {
    const router = makeRouter(SCHOOL_GROUP_URL);
    const items = await router.collectMainMenu(student);
    const communityBtn = items.find((i) => i.text === '💬 Сообщество школы');
    expect(communityBtn).toBeDefined();
    expect(communityBtn!.kind).toBe('url');
    expect((communityBtn as any).url).toBe(SCHOOL_GROUP_URL);
  });

  test('кнопка «Сообщество школы» доступна ментору', async () => {
    const router = makeRouter(SCHOOL_GROUP_URL);
    const items = await router.collectMainMenu(mentor);
    const communityBtn = items.find((i) => i.text === '💬 Сообщество школы');
    expect(communityBtn).toBeDefined();
    expect(communityBtn!.kind).toBe('url');
    expect((communityBtn as any).url).toBe(SCHOOL_GROUP_URL);
  });

  test('кнопка «Сообщество школы» имеет низкий приоритет (после основных)', async () => {
    const router = makeRouter(SCHOOL_GROUP_URL);
    const items = await router.collectMainMenu(guest);
    const communityIdx = items.findIndex(
      (i) => i.text === '💬 Сообщество школы',
    );
    expect(communityIdx).toBeGreaterThan(0);
    const communityBtn = items[communityIdx]!;
    expect(communityBtn.priority).toBe(100);
  });

  test('без schoolGroupUrl кнопка не добавляется', async () => {
    const router = makeRouter();
    const items = await router.collectMainMenu(guest);
    expect(items.some((i) => i.text === '💬 Сообщество школы')).toBe(false);
  });
});
