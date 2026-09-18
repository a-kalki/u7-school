import { describe, expect, mock, test } from 'bun:test';
import {
  type StreamCompletedEvent,
  type StreamMembers,
  StudentOutcomeCategory,
} from '@u7-scl/stream/domain';
import type { PeerReviewApiModuleResolver } from '#domain/module';
import type { ReviewCampaign } from '#domain/review-campaign/entity';
import type { ReviewCampaignRepo } from '#domain/review-campaign/repo';
import { CreateCampaignUc } from '../review-campaign/create-campaign-uc';
import { StreamCompletedEr } from './stream-completed-er';

const SCOPE = '11111111-1111-4111-8111-111111111111';

function makeEvent(): StreamCompletedEvent {
  return {
    eventId: crypto.randomUUID(),
    eventName: 'stream.completed',
    occurredAt: '2026-09-20T10:00',
    aggregateName: 'Stream',
    aggregateId: SCOPE,
    payload: { streamId: SCOPE },
  };
}

function makeMembers(): StreamMembers {
  return {
    mentorId: '66666666-6666-4666-8666-666666666666',
    students: [
      {
        userId: '22222222-2222-4222-8222-222222222222',
        outcomeCategory: StudentOutcomeCategory.COMPLETED,
        neverStarted: false,
      },
    ],
  };
}

function existingCampaign(): ReviewCampaign {
  return {
    uuid: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    context: 'stream_completed',
    scopeId: SCOPE,
    createdAt: '2026-09-20T10:00',
    expiresAt: '2026-09-27T10:00',
    participants: [],
    payload: {},
  };
}

/**
 * Интеграционная связка ER → UC: реальный CreateCampaignUc против
 * моков репозитория и фасада stream.
 */
function makeEr(overrides: { existing?: ReviewCampaign } = {}) {
  const saved: ReviewCampaign[] = [];
  const resolve = {
    reviewCampaignRepo: {
      save: mock((c: ReviewCampaign) => {
        saved.push(c);
        return Promise.resolve();
      }),
      findByScope: mock(() => Promise.resolve(overrides.existing)),
    } as unknown as ReviewCampaignRepo,
    reviewRepo: {},
    streamFacade: {
      getMembers: mock(() => Promise.resolve(makeMembers())),
    },
    appResolver: {
      logger: console,
      mode: 'test' as const,
      eventBus: { publish: () => {} },
    },
    eventBus: { publish: () => {} },
  };

  const uc = new CreateCampaignUc();
  uc.init(resolve as unknown as PeerReviewApiModuleResolver);
  const er = new StreamCompletedEr(uc);
  er.init(resolve as unknown as PeerReviewApiModuleResolver);
  return { er, saved };
}

describe('StreamCompletedEr (ФР-7)', () => {
  test('на stream.completed создаёт кампанию контекста stream_completed', async () => {
    const { er, saved } = makeEr();

    await er.handle(makeEvent());

    expect(saved).toHaveLength(1);
    expect(saved[0]!.context).toBe('stream_completed');
    expect(saved[0]!.scopeId).toBe(SCOPE);
  });

  test('повтор события — не дубль кампании (идемпотентность)', async () => {
    const { er, saved } = makeEr({ existing: existingCampaign() });

    await er.handle(makeEvent());
    await er.handle(makeEvent());

    expect(saved).toHaveLength(0);
  });

  test('ошибка UC не выплёскивается из ER (шина изолирует)', async () => {
    const resolve = {
      reviewCampaignRepo: {
        save: mock(() => Promise.resolve()),
        findByScope: mock(() => Promise.resolve(undefined)),
      },
      reviewRepo: {},
      streamFacade: { getMembers: mock(() => Promise.resolve(undefined)) },
      appResolver: {
        logger: console,
        mode: 'test' as const,
        eventBus: { publish: () => {} },
      },
      eventBus: { publish: () => {} },
    };
    const uc = new CreateCampaignUc();
    uc.init(resolve as unknown as PeerReviewApiModuleResolver);
    const er = new StreamCompletedEr(uc);
    er.init(resolve as unknown as PeerReviewApiModuleResolver);

    await expect(er.handle(makeEvent())).resolves.toBeUndefined();
  });
});
