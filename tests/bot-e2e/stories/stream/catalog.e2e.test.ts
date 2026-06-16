import { describe, expect, test, beforeAll, afterAll } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import { BotRouter } from '@u7-scl/core/ui';
import type { SessionData } from '@u7-scl/core/ui';
import { StreamController } from '@u7-scl/stream/ui/bot/controller/stream-controller';
import { createTestApp } from '../../helpers/test-app';
import type { TestApp } from '../../helpers/test-app';

/**
 * US-1: Просмотр витрины потоков (Каталог).
 *
 * Покрытие:
 * - Гость → видит enrollment + active
 * - Гость → не видит completed + archived
 * - Студент → видит то же самое (публичная витрина)
 * - Ментор → видит то же самое (публичная витрина)
 * - Кнопка «Наши потоки» доступна всем ролям в главном меню
 */
describe('CatalogStory e2e', () => {
  let app: TestApp;
  let router: BotRouter;
  let guest: User;
  let student: User;
  let mentor: User;
  const session: SessionData = { activeHandler: null };

  beforeAll(async () => {
    app = await createTestApp('catalog');
    const streamController = new StreamController(app.streamModule);
    streamController.init(app.apiApp);
    router = new BotRouter([streamController]);
    guest = (await app.userFacade.getUserByTelegramId(1001))!;
    student = (await app.userFacade.getUserByTelegramId(1003))!;
    mentor = (await app.userFacade.getUserByTelegramId(1004))!;
  });

  afterAll(async () => {
    await app.cleanup();
  });

  // ── Гость ──

  test('гость видит витрину — только enrollment и active', async () => {
    const response = await router.handleCallback(
      'stream:catalog:list',
      guest,
      session,
    );

    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('Потоки школы');

    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];

    expect(btnTexts.some((t) => t.includes('Набор'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Активный'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Завершён'))).toBe(false);
    expect(btnTexts.some((t) => t.includes('Архив'))).toBe(false);
  });

  test('гость — завершённые и архивные потоки не показываются', async () => {
    const btnTexts =
      (await router.handleCallback('stream:catalog:list', guest, session))
        .sendMessage?.keyboard?.rows.flat()
        .map((b) => b.text) ?? [];

    expect(btnTexts.filter((t) => t.includes('Завершён') || t.includes('Архив'))).toHaveLength(0);
  });

  // ── Студент ──

  test('студент видит ту же витрину, что и гость', async () => {
    const response = await router.handleCallback(
      'stream:catalog:list',
      student,
      session,
    );

    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btnTexts.some((t) => t.includes('Набор'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Активный'))).toBe(true);
  });

  // ── Ментор ──

  test('ментор видит ту же витрину, что и гость', async () => {
    const response = await router.handleCallback(
      'stream:catalog:list',
      mentor,
      session,
    );

    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btnTexts.some((t) => t.includes('Набор'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Активный'))).toBe(true);
  });

  // ── Главное меню ──

  test('кнопка «Наши потоки» доступна гостю', async () => {
    const items = await router.collectMainMenu(guest);
    expect(items.some((i) => i.text.includes('Наши потоки'))).toBe(true);
  });

  test('кнопка «Наши потоки» доступна студенту', async () => {
    const items = await router.collectMainMenu(student);
    expect(items.some((i) => i.text.includes('Наши потоки'))).toBe(true);
  });

  test('кнопка «Наши потоки» доступна ментору', async () => {
    const items = await router.collectMainMenu(mentor);
    expect(items.some((i) => i.text.includes('Наши потоки'))).toBe(true);
  });
});
