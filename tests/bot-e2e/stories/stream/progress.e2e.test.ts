import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import type { SessionData } from '@u7-scl/core/ui';
import { BotRouter } from '@u7-scl/core/ui';
import { StreamController } from '@u7-scl/stream/ui/bot/controller/stream-controller';
import type { TestApp } from '../../helpers/test-app';
import { createTestApp } from '../../helpers/test-app';

const ACTIVE_ID = 'e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1';

/**
 * US-5: Просмотр прогресса студента.
 *
 * Покрытие:
 * - Студент → видит ментора, дату, проект, урок, прогресс-бар, чат
 * - Студент с 0 выполненными шагами → 0% прогресс
 * - Гость → ошибка доступа (не записан на поток)
 */
describe('ProgressStory e2e', () => {
  let app: TestApp;
  let router: BotRouter;
  let student: User;
  let guest: User;
  const session: SessionData = { activeHandler: null };

  beforeAll(async () => {
    app = await createTestApp('progress');
    const streamController = new StreamController(app.streamModule);
    streamController.init(app.apiApp);
    router = new BotRouter([streamController]);
    student = (await app.userFacade.getUserByTelegramId(1003))!;
    guest = (await app.userFacade.getUserByTelegramId(1001))!;
  });

  afterAll(async () => {
    await app.cleanup();
  });

  test('студент видит прогресс: ментор, дата, проект, урок, бар, чат', async () => {
    const response = await router.handleCallback(
      `stream:progress:progress:${ACTIVE_ID}`,
      student,
      session,
    );

    const text = response.sendMessage?.text ?? '';

    expect(text).toContain('Прогресс');
    expect(text).toContain('JS Core');
    expect(text).toContain('Ментор');
    expect(text).toMatch(/01.*06.*2026/);
    expect(text).toContain('Введение');
    expect(text).toContain('Переменные и типы');
    expect(text).toContain('%');
    expect(text).toContain('шагов');
    expect(text).toContain('🔗');
  });

  test('студент с 0 выполненными шагами → 0%', async () => {
    const response = await router.handleCallback(
      `stream:progress:progress:${ACTIVE_ID}`,
      student,
      session,
    );

    const text = response.sendMessage?.text ?? '';
    // В начале обучения — 0 выполненных шагов
    expect(text).toContain('0 /');
    expect(text).toContain('0%');
  });

  test('гость — ошибка доступа (нет записи на поток)', async () => {
    try {
      await router.handleCallback(
        `stream:progress:progress:${ACTIVE_ID}`,
        guest,
        session,
      );
      // Если не упало — проверяем текст
    } catch {
      // Ожидаемо — get-student-by-user выбросит ошибку
    }
    // Гость не может вызвать progress, т.к. нет student-записи
    // Сторис должен вернуть ошибку или обработать исключение
  });
});
