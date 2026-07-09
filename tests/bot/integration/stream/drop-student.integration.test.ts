import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import type { TestApp } from '../../helpers/test-app';
import { createTestApp } from '../../helpers/test-app';

const STREAM_ID = 'e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1';
const STUDENT_ID = 'f0f0f0f0-f0f0-f0f0-f0f0-f0f0f0f0f0f0';

describe('DropStudent e2e', () => {
  let app: TestApp;
  let student: User;

  beforeAll(async () => {
    app = await createTestApp('drop-student');
    student = (await app.userFacade.getUserByTelegramId(1003))!;
  });

  afterAll(async () => {
    await app.cleanup();
  });

  test('студент выходит из потока → abandoned (voluntary)', async () => {
    await app.streamModule.execute(
      'drop-student',
      { streamId: STREAM_ID, studentId: STUDENT_ID },
      student.uuid,
    );

    const record = await app.streamModule.execute(
      'get-student-progress',
      { studentId: STUDENT_ID },
      student.uuid,
    );

    expect(record.status).toBe('abandoned');
    expect(record.abandonDetails).toEqual({
      who: 'self',
      cause: 'voluntary',
    });
  });
});
