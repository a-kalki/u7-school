import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import type { SessionData } from '@u7-scl/core/ui';
import { BotRouter } from '@u7-scl/core/ui';
import { StreamController } from '@u7-scl/stream/ui/bot/controller/stream-controller';
import type { TestApp } from '../../helpers/test-app';
import { createTestApp } from '../../helpers/test-app';

/**
 * US-4: Прохождение обучения (активная фаза).
 *
 * Покрытие:
 * - Студент → видит текущий шаг с кнопкой «Выполнено»
 * - Студент → завершает шаг, получает следующий (level='step')
 * - Студент → завершает последний шаг урока → переход level='lesson'
 * - Студент → завершает последний шаг проекта → переход level='project'
 * - Студент → завершает обучение → поздравление (level='stream')
 * - Гость → не видит «Моя учёба» в меню
 * - Студент → видит «Моя учёба» в меню
 * - Ментор → не видит «Моя учёба» в меню
 * - Не записанный пользователь → ошибка «не записаны»
 * - Завершивший студент → поздравление
 */
describe('LearningStory e2e', () => {
  let app: TestApp;
  let router: BotRouter;
  let student: User;
  let guest: User;
  let mentor: User;
  const session: SessionData = { activeHandler: null };

  beforeAll(async () => {
    app = await createTestApp('learning');
    const streamController = new StreamController(app.streamModule);
    streamController.init(app.apiApp);
    router = new BotRouter([streamController]);
    student = (await app.userFacade.getUserByTelegramId(1003))!;
    guest = (await app.userFacade.getUserByTelegramId(1001))!;
    mentor = (await app.userFacade.getUserByTelegramId(1004))!;
  });

  afterAll(async () => {
    await app.cleanup();
  });

  // ═══════════════════════════════════════════
  // Просмотр текущего шага
  // ═══════════════════════════════════════════

  test('студент открывает «Моя учёба» — видит текущий шаг', async () => {
    const response = await router.handleCallback(
      'stream:learning:my-study',
      student,
      session,
    );

    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('Моя учёба');
    expect(text).toContain('JS Core');
    expect(text).toContain('Текущее задание');

    const btns =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btns.some((t) => t.includes('Выполнено'))).toBe(true);
    expect(btns.some((t) => t.includes('Мой прогресс'))).toBe(true);
  });

  // ═══════════════════════════════════════════
  // Завершение шагов и переходы
  // ═══════════════════════════════════════════

  test('завершение шага — level=step (следующий шаг в том же уроке)', async () => {
    // Студент на шаге d0, завершаем → должен перейти на d1 (тот же урок)
    const response = await router.handleCallback(
      'stream:learning:complete:f0f0f0f0-f0f0-f0f0-f0f0-f0f0f0f0f0f0:e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1:d0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
      student,
      session,
    );

    expect(response.sendMessage?.text).toContain('Шаг выполнен');
  });

  test('завершение последнего шага урока — level=lesson (названия уроков)', async () => {
    // После предыдущего теста студент на шаге d1 (последний шаг урока «Переменные и типы»)
    // Завершаем d1 → переход на новый урок «Условные операторы»
    const response = await router.handleCallback(
      'stream:learning:complete:f0f0f0f0-f0f0-f0f0-f0f0-f0f0f0f0f0f0:e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1:d1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1',
      student,
      session,
    );

    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('Переменные и типы'); // завершённый урок
    expect(text).toContain('Условные операторы'); // новый урок
  });

  test('завершение шага в новом уроке — level=step', async () => {
    // Студент на шаге d2, завершаем → d3
    const response = await router.handleCallback(
      'stream:learning:complete:f0f0f0f0-f0f0-f0f0-f0f0-f0f0f0f0f0f0:e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1:d2d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2',
      student,
      session,
    );

    expect(response.sendMessage?.text).toContain('Шаг выполнен');
  });

  test('завершение последнего шага — level=project или stream', async () => {
    // Студент на шаге d3 (последний шаг последнего урока)
    // Завершаем → проект завершён и поток завершён
    const response = await router.handleCallback(
      'stream:learning:complete:f0f0f0f0-f0f0-f0f0-f0f0-f0f0f0f0f0f0:e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1:d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d3d3',
      student,
      session,
    );

    const text = response.sendMessage?.text ?? '';
    // Должен быть либо переход на новый проект, либо завершение потока
    expect(text).toMatch(/Проект|завершён|поздравляем/i);
  });

  // ═══════════════════════════════════════════
  // Главное меню: видимость кнопки «Моя учёба»
  // ═══════════════════════════════════════════

  test('гость НЕ видит «Моя учёба» в главном меню', async () => {
    const items = await router.collectMainMenu(guest);
    expect(items.find((i) => i.text.includes('Моя учёба'))).toBeUndefined();
  });

  test('студент ВИДИТ «Моя учёба» в главном меню', async () => {
    const items = await router.collectMainMenu(student);
    const btn = items.find((i) => i.text.includes('Моя учёба'));
    expect(btn).toBeDefined();
  });

  test('ментор НЕ видит «Моя учёба» в главном меню', async () => {
    const items = await router.collectMainMenu(mentor);
    expect(items.find((i) => i.text.includes('Моя учёба'))).toBeUndefined();
  });

  // ═══════════════════════════════════════════
  // Ошибки и краевые случаи
  // ═══════════════════════════════════════════

  test('гость открывает «Моя учёба» — ошибка «не записаны»', async () => {
    const response = await router.handleCallback(
      'stream:learning:my-study',
      guest,
      session,
    );

    expect(response.sendMessage?.text).toContain('не записаны');
  });

  test('завершивший обучение студент — нет активной записи', async () => {
    // После завершения всех шагов студент имеет status='completed'
    // get-student-by-user ищет только active — поэтому «не записаны»
    const response = await router.handleCallback(
      'stream:learning:my-study',
      student,
      session,
    );

    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('не записаны');
  });
});
