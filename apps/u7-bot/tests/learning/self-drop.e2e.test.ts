import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import { AppController } from '@u7-scl/bot/app/app-controller';
import { LearningController } from '@u7-scl/bot/learning/controller';
import { StreamsController } from '@u7-scl/bot/streams/controller';
import type { TestApp } from '@u7-scl/test-helpers/test-app';
import { createTestApp } from '@u7-scl/test-helpers/test-app';
import {
  createTestBotTransport,
  pressedCode,
  type TestBotTransport,
} from '@u7-scl/test-helpers/test-bot-transport';

/**
 * E2E самовыхода из учёбы (FR-4, восстановление интерактивности после
 * [7034c7e]): кнопка «🚪 Покинуть учёбу» в меню хаба → confirm-диалог →
 * UC drop-student → студент abandoned, мягкий кик из TG-группы потока
 * (FR-6, событие student.abandoned → InactivityStory).
 *
 * Фикстуры: студент tg 1003 → student f0f0f0f0 → поток e1e1e1e1
 * (active, TG-группа -1002222222222).
 */
describe('E2E: Самовыход из учёбы (learning/hub, FR-4/FR-6)', () => {
  let app: TestApp;
  let transport: TestBotTransport;
  let student: User;

  const SCHOOL_GROUP_URL = 'https://t.me/u7_school_group';
  const STREAM_GROUP_ID = -1002222222222;

  beforeAll(async () => {
    app = await createTestApp('learning-self-drop-e2e');
    const streamController = new StreamsController();
    const learningController = new LearningController();
    const appController = new AppController(SCHOOL_GROUP_URL);
    transport = createTestBotTransport(app, [
      appController,
      streamController,
      learningController,
    ]);
    student = (await app.userFacade.getUserByTelegramId(1003))!;
  });

  afterAll(async () => {
    await app.cleanup();
  });

  test('сценарий из меню: Моя учёба → Покинуть учёбу → confirm → кик из группы', async () => {
    const tgId = student.telegramId;

    // 1. /start — главное меню, диалог открыт
    await transport.handleStart(transport.makeBotContext(tgId));

    // 2. «🎓 Моя учёба» — хаб
    const hubResp = await transport.handleCallback(
      transport.makeBotContext(tgId, {
        callbackData: pressedCode(transport, tgId, 'Моя учёба'),
      }),
    );
    expect(String(hubResp.screen?.text)).toContain('Моя учёба');

    // 3. «🚪 Покинуть учёбу» — confirm-диалог
    const confirmResp = await transport.handleCallback(
      transport.makeBotContext(tgId, {
        callbackData: pressedCode(transport, tgId, 'Покинуть учёбу'),
      }),
    );
    const confirmText = String(confirmResp.screen?.text);
    expect(confirmText).toContain('Покинуть учёбу');
    expect(confirmText).toContain('Прогресс сохранится');

    // 4. «🚪 Да, покинуть» — UC drop-student, реплика прощания
    const leaveResp = await transport.handleCallback(
      transport.makeBotContext(tgId, {
        callbackData: pressedCode(transport, tgId, 'Да, покинуть'),
      }),
    );
    const leaveText = String(leaveResp.screen?.text);
    expect(leaveText).toContain('Ты покинул учёбу');

    // 5. FR-6: студент мягко исключён из TG-группы потока (ban + unban)
    const kicks = transport.api.kickedMembers.filter(
      (k) => k.telegramId === tgId,
    );
    expect(kicks.length).toBe(1);
    expect(Number(kicks[0]!.chatId)).toBe(STREAM_GROUP_ID);
    expect(kicks[0]!.unbanned).toBe(true);

    // 6. Студент переведён в abandoned (проверка через домен)
    const studentAfter = await app.apiApp.execute(
      'get-student-by-user',
      { userId: student.uuid },
      student,
    );
    expect((studentAfter as { status: string }).status).toBe('abandoned');
  });

  test('после самовыхода студент теряет кнопку «Моя учёба» в меню (роль STUDENT снята)', async () => {
    // drop-student снимает роль STUDENT — свежий актор из репо без роли,
    // menuButtons больше не отдаёт пункт
    const fresh = (await app.userFacade.getUserByTelegramId(
      student.telegramId,
    ))!;
    expect(fresh.roles).not.toContain('STUDENT');

    const menu = await transport.collectMainMenu(fresh);
    expect(menu.some((i) => i.text.includes('Моя учёба'))).toBe(false);
  });
});
