import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import type { TestApp } from '../../helpers/test-app';
import { createTestApp } from '../../helpers/test-app';

const STREAM_ID = 'e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1';
const STUDENT_ID = 'f0f0f0f0-f0f0-f0f0-f0f0-f0f0f0f0f0f0';

describe('SetNextPreference e2e', () => {
  let app: TestApp;
  let mentor: User;
  let studentUser: User;

  beforeAll(async () => {
    app = await createTestApp('set-next-preference');
    mentor = (await app.userFacade.getUserByTelegramId(1004))!;
    studentUser = (await app.userFacade.getUserByTelegramId(1003))!;
  });

  afterAll(async () => {
    await app.cleanup();
  });

  test('студент со статусом advanced устанавливает предпочтение wants_next', async () => {
    // Сначала ментор завершает студента как advanced
    await app.streamModule.execute(
      'complete-student',
      { streamId: STREAM_ID, studentId: STUDENT_ID, outcome: 'advanced' },
      mentor.uuid,
    );

    // Затем студент устанавливает предпочтение
    await app.streamModule.execute(
      'set-next-preference',
      { streamId: STREAM_ID, studentId: STUDENT_ID, preference: 'wants_next' },
      studentUser.uuid,
    );

    const record = await app.streamModule.execute(
      'get-student-progress',
      { studentId: STUDENT_ID },
      mentor.uuid,
    );

    expect(record.status).toBe('advanced');
    expect(record.completionDetails?.nextPreference).toBe('wants_next');
  });
});
