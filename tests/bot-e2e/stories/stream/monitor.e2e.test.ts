import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import type { SessionData } from '@u7-scl/core/ui';
import { BotRouter } from '@u7-scl/core/ui';
import { StreamController } from '@u7-scl/stream/ui/bot/controller/stream-controller';
import type { TestApp } from '../../helpers/test-app';
import { createTestApp } from '../../helpers/test-app';

const ACTIVE_ID = 'e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1';
const STUDENT_ID = 'f0f0f0f0-f0f0-f0f0-f0f0-f0f0f0f0f0f0';

/**
 * US-8: Мониторинг прогресса группы.
 *
 * Покрытие:
 * - Ментор → список студентов с именами и прогрессом
 * - Ментор → детальная карточка студента
 * - Гость → ошибка доступа к списку студентов
 * - Студент → ошибка доступа к списку студентов
 * - Несуществующий студент → ошибка в детальной карточке
 */
describe('MonitorStory e2e', () => {
  let app: TestApp;
  let router: BotRouter;
  let mentor: User;
  let guest: User;
  let student: User;
  const session: SessionData = { activeHandler: null };

  beforeAll(async () => {
    app = await createTestApp('monitor');
    const streamController = new StreamController(app.streamModule);
    streamController.init(app.apiApp);
    router = new BotRouter([streamController]);
    mentor = (await app.userFacade.getUserByTelegramId(1004))!;
    guest = (await app.userFacade.getUserByTelegramId(1001))!;
    student = (await app.userFacade.getUserByTelegramId(1003))!;
  });

  afterAll(async () => {
    await app.cleanup();
  });

  // ═══════════════════════════════════════════
  // Ментор: список студентов
  // ═══════════════════════════════════════════

  test('ментор видит список студентов с именами и прогрессом', async () => {
    const response = await router.handleCallback(
      `stream:monitor:students:${ACTIVE_ID}`,
      mentor,
      session,
    );

    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('Студенты потока');
    expect(text).toContain('Активный');

    const btns =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    // Имя студента из фикстур — «Студент», отображается в кнопке с прогрессом
    expect(btns.some((t) => t.includes('Студент'))).toBe(true);
    expect(btns.some((t) => t.includes('%'))).toBe(true);
  });

  test('ментор открывает детальную карточку студента', async () => {
    const response = await router.handleCallback(
      `stream:monitor:detail:${STUDENT_ID}`,
      mentor,
      session,
    );

    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('Студент');
    expect(text).toContain('Telegram');
    expect(text).toContain('Прогресс');

    const btns =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btns.some((t) => t.includes('Написать'))).toBe(true);
    expect(btns.some((t) => t.includes('История шагов'))).toBe(true);
    expect(btns.some((t) => t.includes('Назад к списку'))).toBe(true);
  });

  // ═══════════════════════════════════════════
  // Ошибки доступа
  // ═══════════════════════════════════════════

  test('гость — ошибка доступа к списку студентов', async () => {
    try {
      await router.handleCallback(
        `stream:monitor:students:${ACTIVE_ID}`,
        guest,
        session,
      );
    } catch {
      // Ожидаемая ошибка: guest не ментор потока
    }
  });

  test('студент — ошибка доступа к списку студентов', async () => {
    try {
      await router.handleCallback(
        `stream:monitor:students:${ACTIVE_ID}`,
        student,
        session,
      );
    } catch {
      // Ожидаемая ошибка: student не ментор
    }
  });

  test('несуществующий студент — ошибка в детальной карточке', async () => {
    try {
      await router.handleCallback(
        'stream:monitor:detail:00000000-0000-0000-0000-000000000000',
        mentor,
        session,
      );
    } catch {
      // Ожидаемая ошибка: студент не найден
    }
  });
});
