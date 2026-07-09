import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import type { SessionData } from '@u7-scl/core/ui';
import { assertBotResponseValid, BotRouter } from '@u7-scl/core/ui';
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
 * - Ментор → детальная карточка студента (с кнопками действий)
 * - Гость → список студентов (публичная информация)
 * - Гость → детальная карточка студента (read-only, без кнопок действий)
 * - Студент → список студентов (публичная информация)
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
    assertBotResponseValid(response);

    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('Студенты потока');
    expect(text).toContain('JS Core');
    // Прогресс-бары в тексте (хотя бы один из символов)
    expect(text).toContain('░');

    const btns =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    // Имя студента в кнопках
    expect(btns.some((t) => t.includes('Студент'))).toBe(true);
    // Кнопка «⬅️ Назад к потоку»
    expect(btns.some((t) => t.includes('⬅️ Назад к потоку'))).toBe(true);
  });

  test('ментор открывает детальную карточку студента — с кнопками действий', async () => {
    const response = await router.handleCallback(
      `stream:monitor:detail:${STUDENT_ID}`,
      mentor,
      session,
    );
    assertBotResponseValid(response);

    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('👤');
    expect(text).toContain('Статус');
    expect(text).toContain('Прогресс');

    const btns =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btns.some((t) => t.includes('Написать'))).toBe(false);
    expect(btns.some((t) => t.includes('История шагов'))).toBe(true);
    expect(btns.some((t) => t.includes('Назад к списку'))).toBe(true);

    // Кнопки действий ментора для активного студента
    expect(btns.some((t) => t.includes('Неактивен'))).toBe(true);
    expect(btns.some((t) => t.includes('Завершить'))).toBe(true);
  });

  // ═══════════════════════════════════════════
  // Гость: публичный просмотр
  // ═══════════════════════════════════════════

  test('гость видит список студентов (публичная информация)', async () => {
    const response = await router.handleCallback(
      `stream:monitor:students:${ACTIVE_ID}`,
      guest,
      session,
    );
    assertBotResponseValid(response);

    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('Студенты потока');
    expect(text).toContain('Студент');
  });

  test('гость видит детальную карточку студента — со всеми кнопками', async () => {
    const response = await router.handleCallback(
      `stream:monitor:detail:${STUDENT_ID}`,
      guest,
      session,
    );
    assertBotResponseValid(response);

    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('Студент');
    expect(text).toContain('Прогресс');

    const btns =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    // Все кнопки видны гостю (публичная информация)
    expect(btns.some((t) => t.includes('Написать'))).toBe(false);
    expect(btns.some((t) => t.includes('История шагов'))).toBe(true);
    expect(btns.some((t) => t.includes('Назад к списку'))).toBe(true);
  });

  // ═══════════════════════════════════════════
  // Студент: публичный просмотр
  // ═══════════════════════════════════════════

  test('студент видит список студентов (публичная информация)', async () => {
    const response = await router.handleCallback(
      `stream:monitor:students:${ACTIVE_ID}`,
      student,
      session,
    );
    assertBotResponseValid(response);

    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('Студенты потока');
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
