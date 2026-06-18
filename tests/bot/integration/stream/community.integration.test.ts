import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import { BotRouter } from '@u7-scl/core/ui';
import { StreamController } from '@u7-scl/stream/ui/bot/controller/stream-controller';
import type { TestApp } from '../../helpers/test-app';
import { createTestApp } from '../../helpers/test-app';

/**
 * US: Кнопка «Сообщество школы» в главном меню.
 *
 * Покрытие:
 * - Гость → видит кнопку «Сообщество школы»
 * - Студент → видит
 * - Ментор → видит
 * - Кнопка имеет низкий приоритет (после основных пунктов)
 */
describe('CommunityStory integration', () => {
  const SCHOOL_GROUP_URL = 'https://t.me/u7_school_group';
  let app: TestApp;
  let router: BotRouter;
  let guest: User;
  let student: User;
  let mentor: User;

  beforeAll(async () => {
    app = await createTestApp('community');
    const streamController = new StreamController(app.streamModule, SCHOOL_GROUP_URL);
    streamController.init(app.apiApp);
    router = new BotRouter([streamController]);
    guest = (await app.userFacade.getUserByTelegramId(1001))!;
    student = (await app.userFacade.getUserByTelegramId(1003))!;
    mentor = (await app.userFacade.getUserByTelegramId(1004))!;
  });

  afterAll(async () => {
    await app.cleanup();
  });

  test('кнопка «Сообщество школы» доступна гостю', async () => {
    const items = await router.collectMainMenu(guest);
    const communityBtn = items.find((i) => i.text === '💬 Сообщество школы');
    expect(communityBtn).toBeDefined();
    expect(communityBtn!.url).toBe(SCHOOL_GROUP_URL);
  });

  test('кнопка «Сообщество школы» доступна студенту', async () => {
    const items = await router.collectMainMenu(student);
    const communityBtn = items.find((i) => i.text === '💬 Сообщество школы');
    expect(communityBtn).toBeDefined();
    expect(communityBtn!.url).toBe(SCHOOL_GROUP_URL);
  });

  test('кнопка «Сообщество школы» доступна ментору', async () => {
    const items = await router.collectMainMenu(mentor);
    const communityBtn = items.find((i) => i.text === '💬 Сообщество школы');
    expect(communityBtn).toBeDefined();
    expect(communityBtn!.url).toBe(SCHOOL_GROUP_URL);
  });

  test('кнопка «Сообщество школы» имеет низкий приоритет (после основных)', async () => {
    const items = await router.collectMainMenu(guest);
    const communityIdx = items.findIndex((i) => i.text === '💬 Сообщество школы');
    expect(communityIdx).toBeGreaterThan(0); // не первая
    // Проверяем, что приоритет >= 100 (после всех основных пунктов)
    const communityBtn = items[communityIdx]!;
    expect(communityBtn.priority).toBe(100);
  });

  test('без schoolGroupUrl кнопка не добавляется', async () => {
    const streamController = new StreamController(app.streamModule);
    streamController.init(app.apiApp);
    const routerNoUrl = new BotRouter([streamController]);
    const items = await routerNoUrl.collectMainMenu(guest);
    expect(items.some((i) => i.text === '💬 Сообщество школы')).toBe(false);
  });
});
