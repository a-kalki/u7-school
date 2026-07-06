import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import type { SessionData } from '@u7-scl/core/ui';
import { assertBotResponseValid, BotRouter } from '@u7-scl/core/ui';
import { StreamController } from '@u7-scl/stream/ui/bot/controller/stream-controller';
import type { TestApp } from '../../helpers/test-app';
import { createTestApp } from '../../helpers/test-app';

const ENROLLMENT_ID = 'e0e0e0e0-e0e0-e0e0-e0e0-e0e0e0e0e0e0'; // enrollment, есть goal/result
const COMPLETED_ID = 'e2e2e2e2-e2e2-e2e2-e2e2-e2e2e2e2e2e2'; // completed

describe('StreamDetails e2e', () => {
  let app: TestApp;
  let router: BotRouter;
  let guest: User;
  const session: SessionData = { activeHandler: null };

  beforeAll(async () => {
    app = await createTestApp('stream-details');
    const streamController = new StreamController(app.streamModule);
    streamController.init(app.apiApp);
    router = new BotRouter([streamController]);
    guest = (await app.userFacade.getUserByTelegramId(1001))!;
  });

  afterAll(async () => {
    await app.cleanup();
  });

  test('кнопка «📋 Детали» есть на enrollment потоке', async () => {
    const r = await router.handleCallback(
      `stream:view-stream:view:${ENROLLMENT_ID}`,
      guest,
      session,
    );
    assertBotResponseValid(r);

    const btns =
      r.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btns.some((t) => t.includes('Детали'))).toBe(true);
  });

  test('кнопка «Детали» есть на completed потоке', async () => {
    const r = await router.handleCallback(
      `stream:view-stream:view:${COMPLETED_ID}`,
      guest,
      session,
    );
    assertBotResponseValid(r);

    const btns =
      r.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btns.some((t) => t.includes('Детали'))).toBe(true);
  });

  test('нажатие «Детали» — показывает заполненные поля', async () => {
    const r = await router.handleCallback(
      `stream:view-stream:details:${ENROLLMENT_ID}`,
      guest,
      session,
    );
    assertBotResponseValid(r);

    const text = r.sendMessage?.text ?? '';
    expect(text).toContain('Детали');
    expect(text).toContain('JS Core');
    // enrollment поток (e0) имеет goal: «Научиться писать серверный JS»
    expect(text).toContain('Научиться писать серверный');
  });

  test('кнопка «Назад к потоку» в деталях', async () => {
    const r = await router.handleCallback(
      `stream:view-stream:details:${ENROLLMENT_ID}`,
      guest,
      session,
    );
    assertBotResponseValid(r);

    const btns =
      r.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btns.some((t) => t.includes('Назад к потоку'))).toBe(true);
  });
});
