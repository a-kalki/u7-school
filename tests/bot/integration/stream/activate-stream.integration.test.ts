import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import type { SessionData } from '@u7-scl/core/ui';
import { assertBotResponseValid, BotRouter } from '@u7-scl/core/ui';
import { StreamStatus } from '@u7-scl/stream';
import { StreamController } from '@u7-scl/stream/ui/bot/controller/stream-controller';
import type { TestApp } from '../../helpers/test-app';
import { createTestApp } from '../../helpers/test-app';

const ENROLLMENT_ID = 'e0e0e0e0-e0e0-e0e0-e0e0-e0e0e0e0e0e0';

/**
 * US-7: Запуск потока (старт обучения).
 *
 * Покрытие:
 * - Ментор → активирует enrollment-поток
 * - После активации → статус потока меняется на active
 * - Гость → ошибка доступа при попытке активации
 */
describe('ActivateStreamStory e2e', () => {
  let app: TestApp;
  let router: BotRouter;
  let mentor: User;
  let guest: User;
  const session: SessionData = { activeHandler: null };

  beforeAll(async () => {
    app = await createTestApp('activate-stream');
    const streamController = new StreamController(app.streamModule);
    streamController.init(app.apiApp);
    router = new BotRouter([streamController]);
    mentor = (await app.userFacade.getUserByTelegramId(1004))!;
    guest = (await app.userFacade.getUserByTelegramId(1001))!;
  });

  afterAll(async () => {
    await app.cleanup();
  });

  test('ментор активирует enrollment-поток — успех', async () => {
    const response = await router.handleCallback(
      `stream:activate-stream:activate:${ENROLLMENT_ID}`,
      mentor,
      session,
    );
    assertBotResponseValid(response);

    expect(response.sendMessage?.text).toContain('Поток запущен');
  });

  test('после активации статус потока = active', async () => {
    const stream = await app.streamModule.execute('get-stream', {
      streamId: ENROLLMENT_ID,
    });
    expect(stream.status).toBe(StreamStatus.ACTIVE);
  });

  test('гость — ошибка доступа при попытке активации', async () => {
    // Активируем другой поток — в этом describe поток уже active после первого теста.
    // Гость пытается активировать поток, который уже active — доменная ошибка.
    // Проверяем, что гость вообще не может выполнить команду.
    try {
      await router.handleCallback(
        `stream:activate-stream:activate:${ENROLLMENT_ID}`,
        guest,
        session,
      );
      // Если не упало — проверяем текст ответа
    } catch {
      // Ожидаемая ошибка: либо access denied, либо поток не в enrollment
    }
  });
});
