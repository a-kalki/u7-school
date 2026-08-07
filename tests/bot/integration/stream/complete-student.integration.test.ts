import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import type { SessionData } from '@u7-scl/core/ui';
import { assertBotResponseValid, UiApp } from '@u7-scl/core/ui';
import { StreamController } from '@u7-scl/stream/ui/bot/controller/stream-controller';
import type { TestApp } from '../../helpers/test-app';
import { createTestApp } from '../../helpers/test-app';

const ACTIVE_ID = 'e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1';

/** Активный студент — можно завершить */
const STUDENT_ACTIVE = 'f0f0f0f0-f0f0-f0f0-f0f0-f0f0f0f0f0f0';

/** Уже завершённый (advanced) — для проверки «Сменить исход» */
const STUDENT_ADVANCED = 'f1f1f1f1-f1f1-f1f1-f1f1-f1f1f1f1f1f1';

/**
 * Bot-level интеграционные тесты действий ментора через UiApp.handleCallback.
 *
 * Покрытие:
 * - ✅ Завершить → выбор исхода → подтверждение → UC → статус изменился
 * - 🔄 Сменить исход → выбор исхода → подтверждение → outcome изменился
 */
describe('CompleteStudent bot-level', () => {
  let app: TestApp;
  let router: UiApp;
  let mentor: User;
  const session: SessionData = { activeHandler: null };

  beforeAll(async () => {
    app = await createTestApp('complete-student');
    const streamController = new StreamController();
    streamController.init(app.apiApp, undefined as never);
    router = new UiApp([streamController]);
    mentor = (await app.userFacade.getUserByTelegramId(1004))!;
  });

  afterAll(async () => {
    await app.cleanup();
  });

  // ═══════════════════════════════════════════
  // ✅ Завершить — полный bot-уровень
  // ═══════════════════════════════════════════

  test('✅ Завершить → выбор исхода → подтверждение → статус advanced', async () => {
    // Шаг 1: запрос завершения — выбор исхода
    const r1 = await router.handleCallback(
      `stream:monitor:complete:${STUDENT_ACTIVE}`,
      mentor,
      session,
    );
    assertBotResponseValid(r1);
    expect(r1.sendMessage?.text).toContain('Выберите исход');
    expect(r1.sendMessage?.keyboard).toBeDefined();

    // Шаг 2: выбор «Прошёл» → подтверждение
    const r2 = await router.handleCallback(
      `stream:monitor:complete-confirm:${STUDENT_ACTIVE}:advanced`,
      mentor,
      session,
    );
    assertBotResponseValid(r2);
    expect(r2.sendMessage?.text).toContain('Завершить студента');

    // Шаг 3: подтверждение → выполнение UC
    const r3 = await router.handleCallback(
      `stream:monitor:complete-confirm-confirm:${STUDENT_ACTIVE}:advanced`,
      mentor,
      session,
    );
    assertBotResponseValid(r3);
    const allTexts = [
      r3.sendMessage?.text,
      ...(r3.sendMessages ?? []).map((m) => m.text),
    ]
      .filter(Boolean)
      .join(' ');
    expect(allTexts).toContain('завершён');

    // Проверка: статус изменился
    const student = await app.streamModule.execute(
      'get-student-progress',
      { studentId: STUDENT_ACTIVE },
      mentor.uuid,
    );
    expect(student.status).toBe('advanced');
  });

  // ═══════════════════════════════════════════
  // 🔄 Сменить исход
  // ═══════════════════════════════════════════

  test('🔄 Сменить исход → с advanced на not_advanced', async () => {
    // f1 уже имеет статус advanced (данные в фикстурах)
    // Шаг 1: запрос смены исхода (тот же callback, что и завершение)
    const r1 = await router.handleCallback(
      `stream:monitor:complete:${STUDENT_ADVANCED}`,
      mentor,
      session,
    );
    assertBotResponseValid(r1);
    expect(r1.sendMessage?.text).toContain('Выберите исход');

    // Шаг 2: выбор «Не прошёл»
    const r2 = await router.handleCallback(
      `stream:monitor:complete-confirm:${STUDENT_ADVANCED}:not_advanced`,
      mentor,
      session,
    );
    assertBotResponseValid(r2);
    expect(r2.sendMessage?.text).toContain('Завершить студента');
    expect(r2.sendMessage?.text).toContain('не прошёл');

    // Шаг 3: подтверждение
    const r3 = await router.handleCallback(
      `stream:monitor:complete-confirm-confirm:${STUDENT_ADVANCED}:not_advanced`,
      mentor,
      session,
    );
    assertBotResponseValid(r3);
    const allTexts2 = [
      r3.sendMessage?.text,
      ...(r3.sendMessages ?? []).map((m) => m.text),
    ]
      .filter(Boolean)
      .join(' ');
    expect(allTexts2).toContain('завершён');

    // Проверка: исход сменился
    const student = await app.streamModule.execute(
      'get-student-progress',
      { studentId: STUDENT_ADVANCED },
      mentor.uuid,
    );
    expect(student.status).toBe('not_advanced');
  });
});
