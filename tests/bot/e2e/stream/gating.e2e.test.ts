import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import type { TestApp } from '../../helpers/test-app';
import { createTestApp } from '../../helpers/test-app';

// ── Фикстуры ──

const ENROLLMENT_STREAM_ID = 'e5e5e5e5-e5e5-e5e5-e5e5-e5e5e5e5e5e5'; // Алгоритмика — Поток 1
const SYNTAX_STREAM_ID = 'e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1';

/**
 * E2E: гейтинг модулей (проверка через реальные репозитории).
 *
 * Сценарий:
 * - Курс «Основы программирования»: Синтаксис → Алгоритмика
 * - Поток Синтаксиса (e1, active) + поток Алгоритмики (e5, enrollment)
 * - Студент с advanced на Синтаксисе → запись на Алгоритмику успешна
 * - Студент с not_advanced → отказ с названием предыдущего модуля
 */
describe('Gating E2E', () => {
  let app: TestApp;
  let advancedUser: User;
  let notAdvancedUser: User;

  beforeAll(async () => {
    app = await createTestApp('e2e-gating');
    advancedUser = (await app.userFacade.getUserByTelegramId(1007))!;
    notAdvancedUser = (await app.userFacade.getUserByTelegramId(1008))!;
  });

  afterAll(async () => {
    await app.cleanup();
  });

  test('студент с advanced на Синтаксисе → успешно записывается на Алгоритмику', async () => {
    // Проверяем: student с advanced есть в потоке Синтаксиса
    const syntaxStudents = await app.streamModule.execute(
      'list-stream-students',
      { streamId: SYNTAX_STREAM_ID },
      advancedUser.uuid,
    );
    const adv = syntaxStudents.find(
      (s: { userId: string }) => s.userId === advancedUser.uuid,
    );
    expect(adv).toBeDefined();
    expect(adv!.status).toBe('advanced');

    // Записываемся на Алгоритмику
    await app.streamModule.execute(
      'enroll-student',
      {
        streamId: ENROLLMENT_STREAM_ID,
        userId: advancedUser.uuid,
      },
      advancedUser.uuid,
    );

    // Проверяем создание новой enrolled-записи
    const algoStudents = await app.streamModule.execute(
      'list-stream-students',
      { streamId: ENROLLMENT_STREAM_ID },
      advancedUser.uuid,
    );
    const newEnrollment = algoStudents.find(
      (s: { userId: string }) => s.userId === advancedUser.uuid,
    );
    expect(newEnrollment).toBeDefined();
    expect(newEnrollment!.status).toBe('enrolled');

    // Предыдущая запись НЕ изменилась
    const syntaxAfter = await app.streamModule.execute(
      'list-stream-students',
      { streamId: SYNTAX_STREAM_ID },
      advancedUser.uuid,
    );
    const syntaxStudent = syntaxAfter.find(
      (s: { userId: string }) => s.userId === advancedUser.uuid,
    );
    expect(syntaxStudent).toBeDefined();
    expect(syntaxStudent!.status).toBe('advanced');
  });

  test('студент с not_advanced на Синтаксисе → отказ с названием предыдущего модуля', async () => {
    const syntaxStudents = await app.streamModule.execute(
      'list-stream-students',
      { streamId: SYNTAX_STREAM_ID },
      notAdvancedUser.uuid,
    );
    const na = syntaxStudents.find(
      (s: { userId: string }) => s.userId === notAdvancedUser.uuid,
    );
    expect(na).toBeDefined();
    expect(na!.status).toBe('not_advanced');

    await expect(
      app.streamModule.execute(
        'enroll-student',
        {
          streamId: ENROLLMENT_STREAM_ID,
          userId: notAdvancedUser.uuid,
        },
        notAdvancedUser.uuid,
      ),
    ).rejects.toThrow('Сначала пройдите модуль');
  });

  test('студент без записи на предыдущий модуль → отказ', async () => {
    // Гость (telegramId 1001) не имеет записей на Синтаксисе
    const guest = (await app.userFacade.getUserByTelegramId(1001))!;

    await expect(
      app.streamModule.execute(
        'enroll-student',
        {
          streamId: ENROLLMENT_STREAM_ID,
          userId: guest.uuid,
        },
        guest.uuid,
      ),
    ).rejects.toThrow('Сначала пройдите модуль');
  });

  test('запись на первый модуль курса → разрешён без гейта', async () => {
    // Гость (telegramId 1001) записывается на первый модуль (Синтаксис)
    const guest = (await app.userFacade.getUserByTelegramId(1001))!;

    await app.streamModule.execute(
      'enroll-student',
      {
        streamId: SYNTAX_STREAM_ID,
        userId: guest.uuid,
      },
      guest.uuid,
    );

    const student = await app.streamModule.execute(
      'get-student-by-user',
      { userId: guest.uuid },
      guest.uuid,
    );

    expect(student).toBeDefined();
    expect(student.status).toBe('enrolled');
    expect(student.streamId).toBe(SYNTAX_STREAM_ID);
  });
});
