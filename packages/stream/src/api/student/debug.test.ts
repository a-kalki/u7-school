import { test, expect } from 'bun:test';
import { StreamStudentSchema } from '../../domain/stream-student/entity';
import * as v from 'valibot';
import { isoNow } from '@u7-scl/core/shared';

test('debug', () => {
    const data = {
      uuid: '11111111-1111-4111-8111-111111111111',
      streamId: '22222222-2222-4222-8222-222222222222',
      userId: '33333333-3333-4333-8333-333333333333',
      enrolledAt: isoNow(),
      status: 'active',
      currentStepId: '44444444-4444-4444-4444-444444444444',
      steps: [],
      createdAt: isoNow(),
    };
    const result = v.safeParse(StreamStudentSchema, data);
    console.log(result.success, JSON.stringify(result.issues, null, 2));
});
