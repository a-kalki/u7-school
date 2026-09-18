import { describe, expect, mock, test } from 'bun:test';
import { InProcEventBus } from '@u7-scl/core/infra';
import {
  type StreamMembers,
  StudentOutcomeCategory,
} from '@u7-scl/stream/domain';
import type { PeerReviewApiModuleResolver } from '#domain/module';
import type { ReviewCampaign } from '#domain/review-campaign/entity';
import type { ReviewCampaignRepo } from '#domain/review-campaign/repo';
import { PeerReviewApiModule } from './module';

const SCOPE = '11111111-1111-4111-8111-111111111111';
const SUBJECT = '22222222-2222-4222-8222-222222222222';

function makeMembers(): StreamMembers {
  return {
    mentorId: '66666666-6666-4666-8666-666666666666',
    students: [
      {
        userId: SUBJECT,
        outcomeCategory: StudentOutcomeCategory.COMPLETED,
        neverStarted: false,
      },
    ],
  };
}

/** Мок-резолвер: реальный ER работает против моков репо/фасада. */
function makeResolve(members: StreamMembers | undefined) {
  const eventBus = new InProcEventBus();
  const saved: ReviewCampaign[] = [];
  const resolve = {
    reviewCampaignRepo: {
      save: mock((c: ReviewCampaign) => {
        saved.push(c);
        return Promise.resolve();
      }),
      findBySubject: mock(() =>
        Promise.resolve(undefined),
      ) as unknown as ReviewCampaignRepo['findBySubject'],
    } as unknown as ReviewCampaignRepo,
    reviewRepo: {},
    streamFacade: { getMembers: mock(() => Promise.resolve(members)) },
    appResolver: { logger: console, mode: 'test' as const, eventBus },
    eventBus,
  };
  return { resolve, saved };
}

describe('PeerReviewApiModule (ФР-6)', () => {
  test('пользовательских UC нет — кампании создаёт реакция', () => {
    const { resolve } = makeResolve(makeMembers());
    const mod = new PeerReviewApiModule(
      resolve as unknown as PeerReviewApiModuleResolver,
    );
    expect(mod.useCases).toHaveLength(0);
    expect(mod.reactions).toHaveLength(1);
    const [er] = mod.reactions;
    expect([...er!.getEventNames()].sort()).toEqual([
      'student.abandoned',
      'student.completed',
    ]);
  });

  test('init подписывает ER: student.completed создаёт кампанию окна', async () => {
    const { resolve, saved } = makeResolve(makeMembers());
    const mod = new PeerReviewApiModule(
      resolve as unknown as PeerReviewApiModuleResolver,
    );
    mod.init();

    resolve.eventBus.publish({
      eventId: crypto.randomUUID(),
      eventName: 'student.completed',
      occurredAt: '2026-09-20T10:00',
      aggregateName: 'Student',
      aggregateId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      payload: {
        studentId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        userId: SUBJECT,
        streamId: SCOPE,
        moduleId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        outcome: 'advanced',
      },
    });

    // ER асинхронен (подписка шины) — ждём микротаск
    await new Promise((r) => setTimeout(r, 0));
    expect(saved).toHaveLength(1);
    expect(saved[0]!.context).toBe('stream_ended');
    expect(saved[0]!.scopeId).toBe(SCOPE);
    expect(saved[0]!.subjectId).toBe(SUBJECT);
  });
});
