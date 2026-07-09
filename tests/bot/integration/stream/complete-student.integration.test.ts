import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import type { TestApp } from '../../helpers/test-app';
import { createTestApp } from '../../helpers/test-app';

const STREAM_ID = 'e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1';
const STUDENT_ID = 'f0f0f0f0-f0f0-f0f0-f0f0-f0f0f0f0f0f0';

describe('CompleteStudent e2e', () => {
  let app: TestApp;
  let mentor: User;

  beforeAll(async () => {
    app = await createTestApp('complete-student');
    mentor = (await app.userFacade.getUserByTelegramId(1004))!;
  });

  afterAll(async () => {
    await app.cleanup();
  });

  test('ментор завершает студента как advanced', async () => {
    await app.streamModule.execute(
      'complete-student',
      { streamId: STREAM_ID, studentId: STUDENT_ID, outcome: 'advanced' },
      mentor.uuid,
    );

    const record = await app.streamModule.execute(
      'get-student-progress',
      { studentId: STUDENT_ID },
      mentor.uuid,
    );

    expect(record.status).toBe('advanced');
    expect(record.completionDetails).toEqual({
      nextPreference: 'undecided',
    });
  });
});
