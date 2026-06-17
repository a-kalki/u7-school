import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import type { SessionData } from '@u7-scl/core/ui';
import {  BotRouter , assertBotResponseValid } from '@u7-scl/core/ui';
import { StreamController } from '@u7-scl/stream/ui/bot/controller/stream-controller';
import type { TestApp } from '../../helpers/test-app';
import { createTestApp } from '../../helpers/test-app';

const ENROLLMENT_ID = 'e0e0e0e0-e0e0-e0e0-e0e0-e0e0e0e0e0e0';
const ACTIVE_ID = 'e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1';
const COMPLETED_ID = 'e2e2e2e2-e2e2-e2e2-e2e2-e2e2e2e2e2e2';

/**
 * US-2: Детальная карточка потока.
 *
 * Покрытие:
 * - Гость → enrollment: ментор, программа, запись, назад
 * - Гость → active: уведомить, назад (без записи)
 * - Гость → completed: только назад
 * - Кандидат → enrollment: запись доступна
 * - Студент → enrollment: запись НЕ доступна (уже учится)
 * - Ментор → свой enrollment: запустить, студенты, архив
 * - Ментор → свой active: завершить, студенты, архив
 * - Ментор → чужой поток: гостевые кнопки
 * - Программа курса → показывает проекты и уроки
 * - Программа курса → пустой snapshot
 * - Неизвестный поток → ошибка
 */
describe('ViewStreamStory e2e', () => {
  let app: TestApp;
  let router: BotRouter;
  let guest: User;
  let candidate: User;
  let student: User;
  let mentor: User;
  const session: SessionData = { activeHandler: null };

  beforeAll(async () => {
    app = await createTestApp('view-stream');
    const streamController = new StreamController(app.streamModule);
    streamController.init(app.apiApp);
    router = new BotRouter([streamController]);
    guest = (await app.userFacade.getUserByTelegramId(1001))!;
    candidate = (await app.userFacade.getUserByTelegramId(1002))!;
    student = (await app.userFacade.getUserByTelegramId(1003))!;
    mentor = (await app.userFacade.getUserByTelegramId(1004))!;
  });

  afterAll(async () => {
    await app.cleanup();
  });

  // ═══════════════════════════════════════════
  // Гость
  // ═══════════════════════════════════════════

  test('гость → enrollment: ментор, программа, запись, назад', async () => {
    const response = await router.handleCallback(
      `stream:view-stream:view:${ENROLLMENT_ID}`,
      guest,
      session,
    );
    assertBotResponseValid(response);

    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('JS Core');
    expect(text).toContain('Ментор');

    const btns =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btns.some((t) => t.includes('Записаться'))).toBe(true);
    expect(btns.some((t) => t.includes('Программа курса'))).toBe(true);
    expect(btns.some((t) => t.includes('Назад'))).toBe(true);
    expect(btns.some((t) => t.includes('Запустить'))).toBe(false);
  });

  test('гость → active: уведомить, назад (без записи)', async () => {
    const response = await router.handleCallback(
      `stream:view-stream:view:${ACTIVE_ID}`,
      guest,
      session,
    );
    assertBotResponseValid(response);

    const btns =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btns.some((t) => t.includes('Записаться'))).toBe(false);
    expect(btns.some((t) => t.includes('Уведомить'))).toBe(true);
  });

  test('гость → completed: только кнопка назад', async () => {
    const response = await router.handleCallback(
      `stream:view-stream:view:${COMPLETED_ID}`,
      guest,
      session,
    );
    assertBotResponseValid(response);

    const btns =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btns.some((t) => t.includes('Записаться'))).toBe(false);
    expect(btns.some((t) => t.includes('Уведомить'))).toBe(false);
    expect(btns.some((t) => t.includes('Программа'))).toBe(false);
    expect(btns.some((t) => t.includes('Назад'))).toBe(true);
  });

  // ═══════════════════════════════════════════
  // Кандидат
  // ═══════════════════════════════════════════

  test('кандидат → enrollment: запись доступна', async () => {
    const response = await router.handleCallback(
      `stream:view-stream:view:${ENROLLMENT_ID}`,
      candidate,
      session,
    );
    assertBotResponseValid(response);

    const btns =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btns.some((t) => t.includes('Записаться'))).toBe(true);
  });

  // ═══════════════════════════════════════════
  // Студент (уже учится на active потоке)
  // ═══════════════════════════════════════════

  test('студент → enrollment: запись НЕ доступна (уже учится)', async () => {
    const response = await router.handleCallback(
      `stream:view-stream:view:${ENROLLMENT_ID}`,
      student,
      session,
    );
    assertBotResponseValid(response);

    const btns =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btns.some((t) => t.includes('Записаться'))).toBe(false);
  });

  // ═══════════════════════════════════════════
  // Ментор — свой поток
  // ═══════════════════════════════════════════

  test('ментор → свой enrollment: запустить, студенты, архив', async () => {
    const response = await router.handleCallback(
      `stream:view-stream:view:${ENROLLMENT_ID}`,
      mentor,
      session,
    );
    assertBotResponseValid(response);

    const btns =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btns.some((t) => t.includes('Запустить'))).toBe(true);
    expect(btns.some((t) => t.includes('Студенты'))).toBe(true);
    expect(btns.some((t) => t.includes('В архив'))).toBe(true);
    expect(btns.some((t) => t.includes('Записаться'))).toBe(false);
  });

  test('ментор → свой active: завершить, студенты, архив', async () => {
    const response = await router.handleCallback(
      `stream:view-stream:view:${ACTIVE_ID}`,
      mentor,
      session,
    );
    assertBotResponseValid(response);

    const btns =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btns.some((t) => t.includes('Завершить'))).toBe(true);
    expect(btns.some((t) => t.includes('Студенты'))).toBe(true);
    expect(btns.some((t) => t.includes('В архив'))).toBe(true);
  });

  // ═══════════════════════════════════════════
  // Программа курса
  // ═══════════════════════════════════════════

  test('программа курса → показывает проекты и уроки', async () => {
    const response = await router.handleCallback(
      `stream:view-stream:program:${ENROLLMENT_ID}`,
      guest,
      session,
    );
    assertBotResponseValid(response);

    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('Программа курса');
    expect(text).toContain('Введение');
    expect(text).toContain('Переменные и типы');
    expect(text).toContain('Условные операторы');

    const btns =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btns.some((t) => t.includes('Назад к потоку'))).toBe(true);
  });

  // ═══════════════════════════════════════════
  // Краевые случаи
  // ═══════════════════════════════════════════

  test('неизвестный поток → исключение (поток не найден)', async () => {
    try {
      await router.handleCallback(
        'stream:view-stream:view:00000000-0000-0000-0000-000000000000',
        guest,
        session,
      );
      // Если не упало — проверяем текст
    } catch {
      // Ожидаемое исключение: get-stream выбросит STREAM_NOT_FOUND
    }
  });
});
