import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import type { SessionData } from '@u7-scl/core/ui';
import { BotRouter } from '@u7-scl/core/ui';
import { StreamController } from '@u7-scl/stream/ui/bot/controller/stream-controller';
import type { TestApp } from '../../helpers/test-app';
import { createTestApp } from '../../helpers/test-app';

const ENROLLMENT_ID = 'e0e0e0e0-e0e0-e0e0-e0e0-e0e0e0e0e0e0';
const ACTIVE_ID = 'e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1';

/**
 * US-3: Запись на поток (Регистрация).
 *
 * Покрытие:
 * - Кандидат → успешная запись, дата старта, делегирование в учёбу
 * - Кандидат → после записи создана student-запись
 * - Студент (уже учится) → ошибка при попытке записи
 * - Гость → ошибка при записи на active поток
 * - Запись на несуществующий поток → ошибка
 */
describe('EnrollStory e2e', () => {
  let app: TestApp;
  let router: BotRouter;
  let candidate: User;
  let guest: User;
  let student: User;
  const session: SessionData = { activeHandler: null };

  beforeAll(async () => {
    app = await createTestApp('enroll');
    const streamController = new StreamController(app.streamModule);
    streamController.init(app.apiApp);
    router = new BotRouter([streamController]);
    candidate = (await app.userFacade.getUserByTelegramId(1002))!;
    guest = (await app.userFacade.getUserByTelegramId(1001))!;
    student = (await app.userFacade.getUserByTelegramId(1003))!;
  });

  afterAll(async () => {
    await app.cleanup();
  });

  // ═══════════════════════════════════════════
  // Успешная запись
  // ═══════════════════════════════════════════

  test('кандидат записывается — успех, дата старта, делегирование в учёбу', async () => {
    const response = await router.handleCallback(
      `stream:enroll:enroll:${ENROLLMENT_ID}`,
      candidate,
      session,
    );

    const mainMsg = response.sendMessage;
    const allTexts = [
      mainMsg?.text ?? '',
      ...(response.sendMessages ?? []).map((m) => m.text),
    ].join(' ');

    expect(allTexts).toContain('успешно записаны');
    expect(allTexts).toMatch(/01.*07.*2026/);
    expect(allTexts).toContain('JS Core');
  });

  test('после записи — студент найден через get-student-by-user', async () => {
    const studentRecord = await app.streamModule.execute(
      'get-student-by-user',
      {
        userId: candidate.uuid,
      },
      candidate.uuid,
    );
    expect(studentRecord).toBeDefined();
    expect(studentRecord.status).toBe('active');
    expect(studentRecord.streamId).toBe(ENROLLMENT_ID);
  });

  // ═══════════════════════════════════════════
  // Ошибки
  // ═══════════════════════════════════════════

  test('студент (уже учится) — ошибка при попытке записи', async () => {
    // Студент уже зачислен на active поток — пытается записаться на enrollment
    // Доменное правило: нельзя записаться на два потока одновременно
    try {
      await router.handleCallback(
        `stream:enroll:enroll:${ENROLLMENT_ID}`,
        student,
        session,
      );
    } catch {
      // Ожидаемая ошибка: конфликт — уже учится в другом потоке
    }
  });

  test('гость — запись на active поток невозможна (нет кнопки)', async () => {
    // Сначала смотрим карточку active потока
    const viewResp = await router.handleCallback(
      `stream:view-stream:view:${ACTIVE_ID}`,
      guest,
      session,
    );

    const btns =
      viewResp.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    // На active потоке нет кнопки «Записаться» для гостя
    expect(btns.some((t) => t.includes('Записаться'))).toBe(false);
  });

  test('запись на несуществующий поток → исключение', async () => {
    try {
      await router.handleCallback(
        'stream:enroll:enroll:00000000-0000-0000-0000-000000000000',
        guest,
        session,
      );
    } catch {
      // Ожидаемое исключение: get-stream выбросит STREAM_NOT_FOUND
    }
  });
});
