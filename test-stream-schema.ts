import { StreamSchema } from './packages/stream/src/domain/stream/entity';
import * as v from 'valibot';

const data = {
  uuid: crypto.randomUUID(),
  title: 'Поток',
  description: 'Описание',
  mentorId: '33333333-3333-4333-8333-333333333333',
  moduleId: '44444444-4444-4444-4444-444444444444',
  startDate: '2026-06-01T12:00:00.000Z',
  status: 'enrollment',
  contentSnapshot: [],
  createdAt: '2026-06-01T10:00:00.000Z',
};

const result = v.safeParse(StreamSchema, data);
if (!result.success) {
  console.log(JSON.stringify(result.issues, null, 2));
}
