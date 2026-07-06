import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import type { SessionData } from '@u7-scl/core/ui';
import { assertBotResponseValid, BotRouter } from '@u7-scl/core/ui';
import { StreamController } from '@u7-scl/stream/ui/bot/controller/stream-controller';
import type { TestApp } from '../../helpers/test-app';
import { createTestApp } from '../../helpers/test-app';

const ENROLLMENT_KEY_ID = 'e4e4e4e4-e4e4-e4e4-e4e4-e4e4e4e4e4e4';
const ENROLLMENT_ID = 'e0e0e0e0-e0e0-e0e0-e0e0-e0e0e0e0e0e0';

describe('EnrollmentKey e2e', () => {
  let app: TestApp;
  let router: BotRouter;
  let candidate: User;
  let guest: User;

  beforeAll(async () => {
    app = await createTestApp('enrollment-key');
    const streamController = new StreamController(app.streamModule);
    streamController.init(app.apiApp);
    router = new BotRouter([streamController]);
    candidate = (await app.userFacade.getUserByTelegramId(1002))!;
    guest = (await app.userFacade.getUserByTelegramId(1001))!;
  });

  afterAll(async () => {
    await app.cleanup();
  });

  test('поток без enrollmentKey — прямое зачисление', async () => {
    const response = await router.handleCallback(
      `stream:enroll:enroll:${ENROLLMENT_ID}`,
      candidate,
      { activeHandler: null },
    );
    assertBotResponseValid(response);

    const allTexts = [
      response.sendMessage?.text ?? '',
      ...(response.sendMessages ?? []).map((m) => m.text),
    ].join(' ');
    expect(allTexts).toContain('успешно записаны');
  });

  test('поток с enrollmentKey — запрос слова → верный ввод → зачисление', async () => {
    // Используем гостя (не зачислен никуда)
    const session: SessionData = { activeHandler: null };
    const r1 = await router.handleCallback(
      `stream:enroll:enroll:${ENROLLMENT_KEY_ID}`,
      guest,
      session,
    );
    assertBotResponseValid(r1);
    expect(r1.sendMessage?.text).toContain('кодовое слово');

    const r2 = await router.handleMessage(
      {
        type: 'message',
        text: 'secret123',
        telegramId: guest.telegramId,
      },
      guest,
      session,
    );
    assertBotResponseValid(r2);
    const allTexts = [
      r2!.sendMessage?.text ?? '',
      ...(r2!.sendMessages ?? []).map((m) => m.text),
    ].join(' ');
    expect(allTexts).toContain('успешно записаны');
  });

  test('неверное слово — сообщение об оставшихся попытках', async () => {
    // Гость уже зачислен на предыдущем тесте — используем кандидата
    const session: SessionData = { activeHandler: null };
    const r1 = await router.handleCallback(
      `stream:enroll:enroll:${ENROLLMENT_KEY_ID}`,
      candidate,
      session,
    );
    assertBotResponseValid(r1);

    const r2 = await router.handleMessage(
      { type: 'message', text: 'wrong', telegramId: candidate.telegramId },
      candidate,
      session,
    );
    assertBotResponseValid(r2);
    expect(r2!.sendMessage?.text).toContain('Неверное');
    expect(r2!.sendMessage?.text).toContain('2');
  });

  test('3 неверных попытки — возврат к карточке', async () => {
    // Продолжаем с тем же кандидатом, активная сессия еще есть
    const session: SessionData = { activeHandler: null };
    const r1 = await router.handleCallback(
      `stream:enroll:enroll:${ENROLLMENT_KEY_ID}`,
      candidate,
      session,
    );
    assertBotResponseValid(r1);

    // 1-я неверная
    await router.handleMessage(
      { type: 'message', text: 'n1', telegramId: candidate.telegramId },
      candidate,
      session,
    );
    // 2-я неверная
    await router.handleMessage(
      { type: 'message', text: 'n2', telegramId: candidate.telegramId },
      candidate,
      session,
    );
    // 3-я — исчерпаны
    const r2 = await router.handleMessage(
      { type: 'message', text: 'n3', telegramId: candidate.telegramId },
      candidate,
      session,
    );
    assertBotResponseValid(r2);
    expect(session.activeHandler).toBeNull();
    const allTexts = [
      r2!.sendMessage?.text ?? '',
      ...(r2!.sendMessages ?? []).map((m) => m.text),
    ].join(' ');
    expect(allTexts).toContain('исчерпаны');
  });
});
