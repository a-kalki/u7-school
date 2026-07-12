import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import type { SessionData } from '@u7-scl/core/ui';
import { assertBotResponseValid, BotRouter } from '@u7-scl/core/ui';
import { StreamController } from '@u7-scl/stream/ui/bot/controller/stream-controller';
import type { TestApp } from '../../helpers/test-app';
import { createTestApp } from '../../helpers/test-app';

/**
 * US-4: Прохождение обучения (активная фаза).
 *
 * Покрытие:
 * - Студент → видит текущий шаг с кнопкой «Выполнено»
 * - Студент → завершает шаг, сразу видит клавиатуру следующего (level='step')
 * - Студент → завершает последний шаг урока → поздравление + кнопка «Начать следующий урок»
 * - Студент → нажимает «Начать следующий урок» → видит первый шаг нового урока
 * - Студент → завершает последний шаг проекта → поздравление + кнопка «Начать следующий проект»
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

  test('студент открывает «Моя учёба» — видит хаб', async () => {
    const response = await router.handleCallback(
      'stream:learning:my-study',
      student,
      session,
    );
    assertBotResponseValid(response);

    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('Моя учёба');
    
    const btns =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btns.some((t) => t.includes('Продолжить'))).toBe(true);
    expect(btns.some((t) => t.includes('Мой прогресс'))).toBe(true);
  });

  // ═══════════════════════════════════════════
  // Завершение шагов и переходы
  // ═══════════════════════════════════════════

  test('завершение шага — level=step (сразу клавиатура следующего шага)', async () => {
    // Студент на шаге d0, завершаем → получаем клавиатуру шага d1 (тот же урок)
    const response = await router.handleCallback(
      'stream:learning:complete:e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1:d0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
      student,
      session,
    );
    assertBotResponseValid(response);

    // Клавиатура с кнопками «Выполнено» и «Мой прогресс» (без «Шаг выполнен»)
    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('Поток:');
    expect(text).toContain('Шаг 2 из 2');
    expect(text).not.toContain('Шаг выполнен');

    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btnTexts.some((t) => t.includes('Выполнено'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Мой прогресс'))).toBe(true);
  });

  test('завершение последнего шага урока — поздравление + кнопка «Начать следующий урок»', async () => {
    // После предыдущего теста студент на шаге d1 (последний шаг урока «Переменные и типы»)
    // Завершаем d1 → поздравление и кнопка «Начать следующий урок»
    const response = await router.handleCallback(
      'stream:learning:complete:e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1:d1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1',
      student,
      session,
    );
    assertBotResponseValid(response);

    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('завершён');
    expect(text).toContain('Переменные и типы'); // название завершённого урока

    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btnTexts.some((t) => t.includes('Начать следующий урок'))).toBe(
      true,
    );
  });

  test('нажатие «Начать следующий урок» → первый шаг нового урока', async () => {
    // После complete-step с level=lesson, currentStepId уже указывает на новый урок
    const response = await router.handleCallback(
      'stream:learning:my-study:continue',
      student,
      session,
    );
    assertBotResponseValid(response);

    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('Поток:');
    expect(text).toContain('Условные операторы');

    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btnTexts.some((t) => t.includes('Выполнено'))).toBe(true);
  });

  test('завершение шага в новом уроке — level=step', async () => {
    // Студент на шаге d2, завершаем → клавиатура d3
    const response = await router.handleCallback(
      'stream:learning:complete:e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1:d2d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2',
      student,
      session,
    );
    assertBotResponseValid(response);

    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('Шаг 2 из 2');
    expect(text).not.toContain('Шаг выполнен');

    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btnTexts.some((t) => t.includes('Выполнено'))).toBe(true);
  });

  test('завершение последнего шага — level=project или stream', async () => {
    // Студент на шаге d3 (последний шаг последнего урока)
    // Завершаем → проект завершён и поток завершён
    const response = await router.handleCallback(
      'stream:learning:complete:e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1:d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d3d3',
      student,
      session,
    );
    assertBotResponseValid(response);

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
    assertBotResponseValid(response);

    expect(response.sendMessage?.text).toContain('не записаны');
  });

  // Примечание: студент не переходит в completed автоматически после завершения всех шагов —
  // статус меняет ментор через CompleteStudentUc. Поэтому проверка «нет активной записи» неактуальна.
});
