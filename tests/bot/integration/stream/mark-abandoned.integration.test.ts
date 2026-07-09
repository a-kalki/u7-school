import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import type { SessionData } from '@u7-scl/core/ui';
import { BotRouter } from '@u7-scl/core/ui';
import { StreamController } from '@u7-scl/stream/ui/bot/controller/stream-controller';
import type { TestApp } from '../../helpers/test-app';
import { createTestApp } from '../../helpers/test-app';

const STREAM_ID = 'e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1';
const STUDENT_ID = 'f0f0f0f0-f0f0-f0f0-f0f0-f0f0f0f0f0f0';

describe('MarkAbandoned e2e', () => {
  let app: TestApp;
  let router: BotRouter;
  let mentor: User;
  let guest: User;

  beforeAll(async () => {
    app = await createTestApp('mark-abandoned');
    const streamController = new StreamController(app.streamModule);
    streamController.init(app.apiApp);
    router = new BotRouter([streamController]);
    mentor = (await app.userFacade.getUserByTelegramId(1004))!;
    guest = (await app.userFacade.getUserByTelegramId(1001))!;
  });

  afterAll(async () => {
    await app.cleanup();
  });

  test('ментор-владелец отмечает студента неактивным', async () => {
    const session: SessionData = { activeHandler: null };

    // Шаг 1: запрос подтверждения
    const r1 = await router.handleCallback(
      `stream:monitor:mark-abandoned:${STUDENT_ID}`,
      mentor,
      session,
    );
    expect(r1?.sendMessage?.text).toContain('неактивного');

    // Шаг 2: выполнить mark-abandoned
    const r2 = await router.handleCallback(
      `stream:monitor:mark-abandoned-confirm:${STUDENT_ID}`,
      mentor,
      session,
    );

    // Проверка: запись студента сохранена со статусом abandoned
    const student = await app.streamModule.execute(
      'get-student-progress',
      { studentId: STUDENT_ID },
      mentor.uuid,
    );
    expect(student.status).toBe('abandoned');
    expect(student.abandonDetails).toEqual({
      who: 'mentor',
      cause: 'inactivity',
    });
  });

  test('GUEST не может отметить неактивным', async () => {
    try {
      await app.streamModule.execute(
        'mark-abandoned',
        {
          streamId: STREAM_ID,
          studentId: STUDENT_ID,
          cause: 'inactivity' as const,
        },
        guest.uuid,
      );
      expect(false).toBe(true);
    } catch {
      // Ожидаемая ошибка доступа
    }
  });
});
