import { describe, expect, mock, test } from 'bun:test';
import {
  type StreamMembers,
  StudentOutcomeCategory,
} from '@u7-scl/stream/domain';
import type { PeerReviewApiModuleResolver } from '#domain/module';
import type { ReviewCampaign } from '#domain/review-campaign/entity';
import type { CampaignCreatedEvent } from '#domain/review-campaign/events';
import type { ReviewCampaignRepo } from '#domain/review-campaign/repo';
import { CreateCampaignUc } from './create-campaign-uc';

const SCOPE = '11111111-1111-4111-8111-111111111111';
const MENTOR = '66666666-6666-4666-8666-666666666666';
const S_COMPLETED = '22222222-2222-4222-8222-222222222222';
const S_NEVER = '33333333-3333-4333-8333-333333333333';
const S_DROPPED = '44444444-4444-4444-8444-444444444444';
const S_ACTIVE = '55555555-5555-4555-8555-555555555555';

/** Состав потока: завершил, забросил не начав, забросил начав. */
function makeMembers(): StreamMembers {
  return {
    mentorId: MENTOR,
    students: [
      {
        userId: S_COMPLETED,
        outcomeCategory: StudentOutcomeCategory.COMPLETED,
        neverStarted: false,
      },
      {
        userId: S_NEVER,
        outcomeCategory: StudentOutcomeCategory.ABANDONED,
        neverStarted: true,
      },
      {
        userId: S_DROPPED,
        outcomeCategory: StudentOutcomeCategory.ABANDONED,
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

/** Мок-резолвер: репо кампаний собирает сохранённое, шина — опубликованное. */
function makeResolver(overrides: {
  members?: StreamMembers | undefined;
  existing?: ReviewCampaign | undefined;
}) {
  const saved: ReviewCampaign[] = [];
  const published: unknown[] = [];
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
      getMembers: mock(() => Promise.resolve(overrides.members)),
    },
    appResolver: {
      logger: console,
      mode: 'test' as const,
      eventBus: { publish: (e: unknown) => published.push(e) },
    },
    eventBus: { publish: (e: unknown) => published.push(e) },
  };
  const uc = new CreateCampaignUc();
  uc.init(resolve as unknown as PeerReviewApiModuleResolver);
  return { uc, saved, published };
}

const CMD = { context: 'stream_completed' as const, scopeId: SCOPE };

describe('CreateCampaignUc', () => {
  describe('SUCCESS', () => {
    test('создаёт кампанию со снапшотом исходов и окном 7 дней', async () => {
      const before = Date.now();
      const { uc, saved, published } = makeResolver({
        members: makeMembers(),
      });

      const campaign = await uc.handle(CMD, undefined);

      expect(saved).toHaveLength(1);
      const state = saved[0]!;
      expect(state.context).toBe('stream_completed');
      expect(state.scopeId).toBe(SCOPE);
      expect(state.participants).toEqual([
        { userId: S_COMPLETED, role: 'student', outcome: 'completed' },
        { userId: S_NEVER, role: 'student', outcome: 'never_started' },
        { userId: S_DROPPED, role: 'student', outcome: 'dropped' },
        { userId: MENTOR, role: 'mentor' },
      ]);
      // Окно — 7 дней от момента создания (минутная точность)
      const expiresMs = new Date(state.expiresAt).getTime();
      expect(expiresMs).toBeGreaterThanOrEqual(
        before + 7 * 86_400_000 - 60_000,
      );
      expect(expiresMs).toBeLessThanOrEqual(
        Date.now() + 7 * 86_400_000 + 60_000,
      );
      expect(campaign).toEqual(state);
    });

    test('публикует campaign.created после сохранения', async () => {
      const { uc, saved, published } = makeResolver({
        members: makeMembers(),
      });

      await uc.handle(CMD, undefined);

      expect(published).toHaveLength(1);
      const event = published[0] as CampaignCreatedEvent;
      expect(event.eventName).toBe('campaign.created');
      expect(event.aggregateName).toBe('ReviewCampaign');
      expect(event.payload).toEqual({
        campaignId: saved[0]!.uuid,
        context: 'stream_completed',
        scopeId: SCOPE,
      });
    });

    test('идемпотентность: кампания скоупа уже есть — без дубля', async () => {
      const { uc, saved, published } = makeResolver({
        members: makeMembers(),
        existing: existingCampaign(),
      });

      const campaign = await uc.handle(CMD, undefined);

      expect(campaign.uuid).toBe('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee');
      expect(saved).toHaveLength(0);
      expect(published).toHaveLength(0);
    });
  });

  describe('FAIL', () => {
    test('поток не найден — REVIEW_SCOPE_NOT_FOUND', async () => {
      const { uc, saved } = makeResolver({ members: undefined });

      let caught: unknown;
      try {
        await uc.handle(CMD, undefined);
      } catch (e) {
        caught = e;
      }

      expect((caught as { error?: { name?: string } }).error?.name).toBe(
        'REVIEW_SCOPE_NOT_FOUND',
      );
      expect(saved).toHaveLength(0);
    });

    test('нетерминальный студент — CAMPAIGN_SCOPE_NOT_TERMINAL', async () => {
      const members = makeMembers();
      members.students.push({
        userId: S_ACTIVE,
        outcomeCategory: StudentOutcomeCategory.IN_PROGRESS,
        neverStarted: false,
      });
      const { uc, saved } = makeResolver({ members });

      let caught: unknown;
      try {
        await uc.handle(CMD, undefined);
      } catch (e) {
        caught = e;
      }

      expect((caught as { error?: { name?: string } }).error?.name).toBe(
        'CAMPAIGN_SCOPE_NOT_TERMINAL',
      );
      expect(saved).toHaveLength(0);
    });
  });
});
