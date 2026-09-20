import { describe, expect, mock, test } from 'bun:test';
import { AppException } from '@u7-scl/core/domain';
import { InProcEventBus } from '@u7-scl/core/infra';
import type { PeerReviewApiModuleResolver } from '#domain/module';
import type { Review } from '#domain/review/entity';
import type { ReviewRepo } from '#domain/review/repo';
import type { ReviewCampaignRepo } from '#domain/review-campaign/repo';
import { ReviewCampaignFactory } from '#domain/review-campaign/review-campaign-factory';
import { CreateReviewUc } from './create-review-uc';

const SCOPE = '11111111-1111-4111-8111-111111111111';
const ALICE = '22222222-2222-4222-8222-222222222222';
const BOB = '24444444-4444-4444-8444-444444444444';
const CAROL = '25555555-5555-4555-8555-555555555555';
const MENTOR = '33333333-3333-4333-8333-333333333333';
const NOW = new Date('2026-09-20T10:00');
const CAMPAIGN_ID = '3aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const TEXT = 'Крепкий напарник по паре, всё получалось.';

function makeCampaign(now = NOW) {
  return ReviewCampaignFactory.createStudentCampaign({
    scopeId: SCOPE,
    subjectId: ALICE,
    mentorId: MENTOR,
    subjectOutcome: 'completed_passed',
    participantIds: [BOB],
    now,
  });
}

function makeResolve(
  campaign: ReturnType<typeof makeCampaign> | undefined,
  existing?: Review,
) {
  const saved: Review[] = [];
  const resolve = {
    reviewCampaignRepo: {
      findById: mock(() => Promise.resolve(campaign?.state)),
    } as unknown as ReviewCampaignRepo,
    reviewRepo: {
      findByPair: mock(() => Promise.resolve(existing)),
      save: mock((review: Review) => {
        saved.push(review);
        return Promise.resolve();
      }),
    } as unknown as ReviewRepo,
    streamFacade: {},
    appResolver: {
      logger: console,
      mode: 'test' as const,
      eventBus: new InProcEventBus(),
    },
    eventBus: new InProcEventBus(),
  };
  return { resolve: resolve as unknown as PeerReviewApiModuleResolver, saved };
}

function expectError(name: string, kind: string) {
  return (e: unknown) => {
    expect(e).toBeInstanceOf(AppException);
    const error = (e as AppException).error;
    expect(error.name).toBe(name);
    expect(error.kind as string).toBe(kind);
  };
}

describe('CreateReviewUc (ФР-7)', () => {
  test('субъект пишет ментору: снапшоты из кампании, отзыв сохранён', async () => {
    const campaign = makeCampaign();
    const { resolve, saved } = makeResolve(campaign);
    const uc = new CreateReviewUc();
    uc.init(resolve);

    const res = await uc.execute({
      campaignId: CAMPAIGN_ID,
      authorId: ALICE,
      recipientId: MENTOR,
      text: TEXT,
    });

    expect(res.campaignId).toBe(CAMPAIGN_ID);
    expect(res.recipientId).toBe(MENTOR);
    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({
      scopeId: SCOPE,
      campaignId: CAMPAIGN_ID,
      authorId: ALICE,
      direction: 'student_mentor',
      authorOutcome: 'completed_passed',
      recipientId: MENTOR,
    });
  });

  test('дубль пары: перезапись текста, uuid и createdAt сохраняются', async () => {
    const campaign = makeCampaign();
    const existing = {
      uuid: 'aaaaaaaa-aaaa-4aaa-8aaa-000000000000',
      scopeId: SCOPE,
      campaignId: CAMPAIGN_ID,
      authorId: ALICE,
      direction: 'student_mentor' as const,
      authorOutcome: 'completed_passed' as const,
      recipientId: MENTOR,
      text: 'Прежний текст отзыва, довольно длинный.',
      createdAt: '2026-09-20T11:00',
    } satisfies Review;
    const { resolve, saved } = makeResolve(campaign, existing);
    const uc = new CreateReviewUc();
    uc.init(resolve);

    const res = await uc.execute({
      campaignId: CAMPAIGN_ID,
      authorId: ALICE,
      recipientId: MENTOR,
      text: TEXT,
    });

    expect(res.reviewId).toBe(existing.uuid);
    expect(saved).toHaveLength(1);
    expect(saved[0]!.uuid).toBe(existing.uuid);
    expect(saved[0]!.createdAt).toBe('2026-09-20T11:00');
    expect(saved[0]!.text).toBe(TEXT);
  });

  test('истёкшее окно — REVIEW_WINDOW_CLOSED', async () => {
    const expired = makeCampaign(new Date('2026-09-01T10:00'));
    const { resolve } = makeResolve(expired);
    const uc = new CreateReviewUc();
    uc.init(resolve);

    try {
      await uc.execute({
        campaignId: CAMPAIGN_ID,
        authorId: ALICE,
        recipientId: MENTOR,
        text: TEXT,
      });
      expect.unreachable('должен бросить ошибку окна');
    } catch (e) {
      expectError('REVIEW_WINDOW_CLOSED', 'conflict')(e);
    }
  });

  test('адресат вне политики (не в списке адресуемых) — RECIPIENT_NOT_ALLOWED', async () => {
    const campaign = makeCampaign();
    const { resolve } = makeResolve(campaign);
    const uc = new CreateReviewUc();
    uc.init(resolve);

    try {
      await uc.execute({
        campaignId: CAMPAIGN_ID,
        authorId: ALICE,
        recipientId: CAROL,
        text: TEXT,
      });
      expect.unreachable('должен бросить конфликт адресата');
    } catch (e) {
      expectError('PEER_REVIEW_RECIPIENT_NOT_ALLOWED', 'conflict')(e);
    }
  });

  test('запрет «о себе» — RECIPIENT_NOT_ALLOWED', async () => {
    const campaign = makeCampaign();
    const { resolve } = makeResolve(campaign);
    const uc = new CreateReviewUc();
    uc.init(resolve);

    try {
      await uc.execute({
        campaignId: CAMPAIGN_ID,
        authorId: ALICE,
        recipientId: ALICE,
        text: TEXT,
      });
      expect.unreachable('должен бросить конфликт адресата');
    } catch (e) {
      expectError('PEER_REVIEW_RECIPIENT_NOT_ALLOWED', 'conflict')(e);
    }
  });

  test('адресат не участник кампании — RECIPIENT_NOT_ALLOWED', async () => {
    const campaign = makeCampaign();
    const { resolve } = makeResolve(campaign);
    const uc = new CreateReviewUc();
    uc.init(resolve);

    const stranger = '29999999-9999-4999-8999-999999999999';
    try {
      await uc.execute({
        campaignId: CAMPAIGN_ID,
        authorId: ALICE,
        recipientId: stranger,
        text: TEXT,
      });
      expect.unreachable('должен бросить конфликт адресата');
    } catch (e) {
      expectError('PEER_REVIEW_RECIPIENT_NOT_ALLOWED', 'conflict')(e);
    }
  });

  test('текст короче минимума — REVIEW_TEXT_INVALID', async () => {
    const campaign = makeCampaign();
    const { resolve, saved } = makeResolve(campaign);
    const uc = new CreateReviewUc();
    uc.init(resolve);

    try {
      await uc.execute({
        campaignId: CAMPAIGN_ID,
        authorId: ALICE,
        recipientId: MENTOR,
        text: 'коротко',
      });
      expect.unreachable('должен бросить ошибку валидации');
    } catch (e) {
      expectError('REVIEW_TEXT_INVALID', 'validation')(e);
    }
    expect(saved).toHaveLength(0);
  });

  test('посторонний автор (не в снапшоте кампании) — доступ запрещён', async () => {
    const campaign = makeCampaign();
    const { resolve, saved } = makeResolve(campaign);
    const uc = new CreateReviewUc();
    uc.init(resolve);

    const outsider = '29999999-9999-4999-8999-999999999999';
    try {
      await uc.execute({
        campaignId: CAMPAIGN_ID,
        authorId: outsider,
        recipientId: MENTOR,
        text: TEXT,
      });
      expect.unreachable('должен бросить ошибку доступа');
    } catch (e) {
      expectError('PEER_REVIEW_NOT_PARTICIPANT', 'access-denied')(e);
    }
    expect(saved).toHaveLength(0);
  });

  test('кампания не найдена — not-found', async () => {
    const { resolve } = makeResolve(undefined);
    const uc = new CreateReviewUc();
    uc.init(resolve);

    try {
      await uc.execute({
        campaignId: CAMPAIGN_ID,
        authorId: ALICE,
        recipientId: MENTOR,
        text: TEXT,
      });
      expect.unreachable('должен бросить not-found');
    } catch (e) {
      expectError('PEER_REVIEW_CAMPAIGN_NOT_FOUND', 'not-found')(e);
    }
  });
});
