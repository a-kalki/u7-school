import { StreamStudentSchema } from './packages/stream/src/domain/stream-student/entity';
import * as v from 'valibot';

const data = {
  uuid: crypto.randomUUID(),
  streamId: crypto.randomUUID(),
  userId: crypto.randomUUID(),
  enrolledAt: new Date().toISOString(),
  status: 'active',
  currentStepId: crypto.randomUUID(),
  steps: [],
  createdAt: new Date().toISOString(),
};

const result = v.safeParse(StreamStudentSchema, data);
console.log(result.success);
if (!result.success) {
  console.log(JSON.stringify(result.issues, null, 2));
}
