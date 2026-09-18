import { describe, expect, mock, test } from 'bun:test';
import { InProcEventBus } from '@u7-scl/core/infra';
import {
  type StreamMembers,
  StudentOutcomeCategory,
} from '@u7-scl/stream/domain';
import type { PeerReviewApiModuleResolver } from '#domain/module';
import type { ReviewCampaignRepo } from '#domain/review-campaign/repo';
import { PeerReviewApiModule } from './module';

const SCOPE = '11111111-1111-4111-8111-111111111111';

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

/** Мок-резолвер: реальный UC работает против моков репо/фасада. */
function makeResolve(members: StreamMembers | undefined) {
  const eventBus = new InProcEventBus();
  const saved: unknown[] = [];
  const resolve = {
    reviewCampaignRepo: {
      save: mock((c: unknown) => {
        saved.push(c);
        return Promise.resolve();
      }),
      findByScope: mock(() => Promise.resolve(undefined)),
    } as unknown as ReviewCampaignRepo,
    reviewRepo: {},
    streamFacade: { getMembers: mock(() => Promise.resolve(members)) },
    appResolver: { logger: console, mode: 'test' as const, eventBus },
    eventBus,
  };
  return { resolve, saved };
}

describe('PeerReviewApiModule', () => {
  test('create-campaign зарегистрирован и обрабатывает команду', async () => {
    const { resolve, saved } = makeResolve(makeMembers());
    const mod = new PeerReviewApiModule(
      resolve as unknown as PeerReviewApiModuleResolver,
    );
    mod.init();

    const campaign = await mod.execute('create-campaign', {
      context: 'stream_completed',
      scopeId: SCOPE,
    });

    expect(saved).toHaveLength(1);
    expect(campaign?.scopeId).toBe(SCOPE);
  });
});
