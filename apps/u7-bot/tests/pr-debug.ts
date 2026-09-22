import { createTestApp } from './helpers/test-app';

const app = await createTestApp('pr-debug');
app.eventBus.publish({
  eventId: crypto.randomUUID(),
  eventName: 'student.completed',
  occurredAt: '2026-09-22T12:00',
  aggregateName: 'Student',
  aggregateId: 'f1f1f1f1-f1f1-f1f1-f1f1-f1f1f1f1f1f1',
  payload: {
    studentId: 'f1f1f1f1-f1f1-f1f1-f1f1-f1f1f1f1f1f1',
    userId: '77777777-7777-4777-8777-777777777777',
    streamId: 'e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1',
    moduleId: 'a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a0a0',
    outcome: 'advanced',
  },
} as never);
await new Promise((r) => setTimeout(r, 500));
const campaign = await app.reviewCampaignRepo.findBySubject(
  'e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1',
  '77777777-7777-4777-8777-777777777777',
);
console.log('CAMPAIGN:', JSON.stringify(campaign, null, 2));
await app.cleanup();
