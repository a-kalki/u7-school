import { describe, expect, mock, test } from 'bun:test';
import { AppException } from '@u7-scl/core/domain';
import { InProcEventBus } from '@u7-scl/core/infra';
import type { PeerReviewApiModuleResolver } from '#domain/module';
import type { ReviewRepo } from '#domain/review/repo';
import type { ReviewCampaignRepo } from '#domain/review-campaign/repo';
import { ReviewCampaignFactory } from '#domain/review-campaign/review-campaign-factory';
import { GetCampaignRecipientsUc } from './get-campaign-recipients-uc';

const SCOPE = '11111111-1111-4111-8111-111111111111';
const ALICE = '22222222-2222-4222-8222-222222222222';
const BOB = '24444444-4444-4444-8444-444444444444';
const CAROL = '25555555-5555-4555-8555-555555555555';
const MENTOR = '33333333-3333-4333-8333-333333333333';
const NOW = new Date('2026-09-20T10:00');

const CAMPAIGN_ID = '3aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

function makeCampaign() {
  return ReviewCampaignFactory.createStudentCampaign({
    scopeId: SCOPE,
    subjectId: ALICE,
    participants: [
      { userId: ALICE, role: 'student', outcome: 'completed' },
      { userId: BOB, role: 'student', outcome: 'in_progress' },
      { userId: CAROL, role: 'student', outcome: 'dropped' },
      { userId: MENTOR, role: 'mentor' },
    ],
    now: NOW,
  });
}

function makeResolve(
  campaign: ReturnType<typeof makeCampaign> | undefined,
  pairs: Array<[string, string]>,
) {
  const resolve = {
    reviewCampaignRepo: {
      findById: mock(() => Promise.resolve(campaign?.state)),
    } as unknown as ReviewCampaignRepo,
    reviewRepo: {
      findByCampaignAndAuthor: mock((_cid: string, authorId: string) =>
        Promise.resolve(
          pairs
            .filter(([a]) => a === authorId)
            .map(([, r], i) => ({
              uuid: `aaaaaaaa-aaaa-4aaa-8aaa-${String(i).padStart(12, '0')}`,
              scopeId: SCOPE,
              campaignId: campaign?.state.uuid ?? CAMPAIGN_ID,
              authorId,
              authorRole: 'student' as const,
              authorOutcome: 'completed' as const,
              recipientId: r,
              recipientRole: 'student' as const,
              text: 'Достаточно длинный текст отзыва.',
              createdAt: '2026-09-20T11:00',
            })),
        ),
      ),
    } as unknown as ReviewRepo,
    streamFacade: {},
    appResolver: {
      logger: console,
      mode: 'test' as const,
      eventBus: new InProcEventBus(),
    },
    eventBus: new InProcEventBus(),
  };
  return resolve as unknown as PeerReviewApiModuleResolver;
}

describe('GetCampaignRecipientsUc', () => {
  test('субъект completed: ментор + соученик in_progress, ✅-признак', async () => {
    const campaign = makeCampaign();
    const uc = new GetCampaignRecipientsUc();
    uc.init(makeResolve(campaign, [[ALICE, MENTOR]]));

    const res = await uc.execute({ campaignId: CAMPAIGN_ID, authorId: ALICE });
    expect(res.myRole).toBe('subject');
    expect(res.daysLeft).toBeGreaterThan(0);
    expect(res.recipients).toHaveLength(2);
    const byId = new Map(res.recipients.map((r) => [r.userId, r]));
    expect(byId.get(MENTOR)).toMatchObject({
      role: 'mentor',
      hasMyReview: true,
    });
    expect(byId.get(MENTOR)).not.toHaveProperty('outcome');
    expect(byId.get(BOB)).toMatchObject({
      role: 'student',
      outcome: 'in_progress',
      hasMyReview: false,
    });
    expect(byId.has(CAROL)).toBe(false);
  });

  test('ментор: единственный адресат — субъект окна', async () => {
    const campaign = makeCampaign();
    const uc = new GetCampaignRecipientsUc();
    uc.init(makeResolve(campaign, []));

    const res = await uc.execute({ campaignId: CAMPAIGN_ID, authorId: MENTOR });
    expect(res.myRole).toBe('mentor');
    expect(res.recipients).toHaveLength(1);
    expect(res.recipients[0]).toMatchObject({
      userId: ALICE,
      role: 'student',
      outcome: 'completed',
    });
  });

  test('субъект dropped: только ментор', async () => {
    const dropped = ReviewCampaignFactory.createStudentCampaign({
      scopeId: SCOPE,
      subjectId: CAROL,
      participants: [
        { userId: CAROL, role: 'student', outcome: 'dropped' },
        { userId: MENTOR, role: 'mentor' },
      ],
      now: NOW,
    });
    const uc = new GetCampaignRecipientsUc();
    uc.init(makeResolve(dropped, []));

    const res = await uc.execute({ campaignId: CAMPAIGN_ID, authorId: CAROL });
    expect(res.recipients).toHaveLength(1);
    expect(res.recipients[0]!.userId).toBe(MENTOR);
  });

  test('соученик не субъект и не ментор — доступ запрещён', async () => {
    const campaign = makeCampaign();
    const uc = new GetCampaignRecipientsUc();
    uc.init(makeResolve(campaign, []));

    try {
      await uc.execute({ campaignId: CAMPAIGN_ID, authorId: BOB });
      expect.unreachable('должен бросить ошибку доступа');
    } catch (e) {
      expect(e).toBeInstanceOf(AppException);
      const error = (e as AppException).error;
      expect(error.name).toBe('PEER_REVIEW_NOT_PARTICIPANT');
      expect(error.kind).toBe('access-denied');
    }
  });

  test('посторонний пользователь (не в снапшоте кампании) — доступ запрещён', async () => {
    const campaign = makeCampaign();
    const uc = new GetCampaignRecipientsUc();
    uc.init(makeResolve(campaign, []));

    const outsider = '29999999-9999-4999-8999-999999999999';
    try {
      await uc.execute({ campaignId: CAMPAIGN_ID, authorId: outsider });
      expect.unreachable('должен бросить ошибку доступа');
    } catch (e) {
      const error = (e as AppException).error;
      expect(error.name).toBe('PEER_REVIEW_NOT_PARTICIPANT');
    }
  });

  test('кампания не найдена — not-found', async () => {
    const uc = new GetCampaignRecipientsUc();
    uc.init(makeResolve(undefined, []));

    try {
      await uc.execute({ campaignId: CAMPAIGN_ID, authorId: ALICE });
      expect.unreachable('должен бросить ошибку not-found');
    } catch (e) {
      expect(e).toBeInstanceOf(AppException);
      const error = (e as AppException).error;
      expect(error.name).toBe('PEER_REVIEW_CAMPAIGN_NOT_FOUND');
      expect(error.kind).toBe('not-found');
    }
  });
});
