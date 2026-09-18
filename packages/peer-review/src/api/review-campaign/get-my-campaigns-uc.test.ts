import { describe, expect, mock, test } from 'bun:test';
import { InProcEventBus } from '@u7-scl/core/infra';
import type { PeerReviewApiModuleResolver } from '#domain/module';
import type { Review } from '#domain/review/entity';
import type { ReviewRepo } from '#domain/review/repo';
import type { ReviewCampaignRepo } from '#domain/review-campaign/repo';
import { ReviewCampaignFactory } from '#domain/review-campaign/review-campaign-factory';
import { GetMyCampaignsUc } from './get-my-campaigns-uc';

const SCOPE = '11111111-1111-4111-8111-111111111111';
const SCOPE2 = '11111111-1111-4111-8111-111111111112';
const ALICE = '22222222-2222-4222-8222-222222222222';
const BOB = '24444444-4444-4444-8444-444444444444';
const MENTOR = '33333333-3333-4333-8333-333333333333';
const NOW = new Date('2026-09-20T10:00');

const COMPLETED = {
  userId: ALICE,
  role: 'student' as const,
  outcome: 'completed' as const,
};
const MENTOR_P = { userId: MENTOR, role: 'mentor' as const };

function makeCampaign(subject = COMPLETED, scopeId = SCOPE, now = NOW) {
  return ReviewCampaignFactory.createStudentCampaign({
    scopeId,
    subjectId: subject.userId,
    participants: [subject, MENTOR_P],
    now,
  });
}

function makeReviews(
  campaignId: string,
  rows: Array<[string, string]>,
): Review[] {
  return rows.map(([authorId, recipientId], i) => ({
    uuid: `aaaaaaaa-aaaa-4aaa-8aaa-${String(i).padStart(12, '0')}`,
    scopeId: SCOPE,
    campaignId,
    authorId,
    authorRole: 'student' as const,
    authorOutcome: 'completed' as const,
    recipientId,
    recipientRole: 'student' as const,
    text: 'Хороший напарник по паре, всё получалось.',
    createdAt: '2026-09-20T11:00',
  }));
}

function makeResolve(
  campaigns: Array<{
    ar: ReturnType<typeof makeCampaign>;
    myRole: 'subject' | 'mentor';
  }>,
  reviews: Review[],
) {
  const resolve = {
    reviewCampaignRepo: {
      findActiveBySubject: mock(() =>
        Promise.resolve(
          campaigns
            .filter((c) => c.myRole === 'subject')
            .map((c) => c.ar.state),
        ),
      ),
      findActiveByMentor: mock(() =>
        Promise.resolve(
          campaigns.filter((c) => c.myRole === 'mentor').map((c) => c.ar.state),
        ),
      ),
    } as unknown as ReviewCampaignRepo,
    reviewRepo: {
      findByCampaignAndAuthor: mock((_cid: string, authorId: string) =>
        Promise.resolve(reviews.filter((r) => r.authorId === authorId)),
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

describe('GetMyCampaignsUc (ФР-7)', () => {
  test('различает myRole: субъект и ментор', async () => {
    const own = makeCampaign();
    const uc = new GetMyCampaignsUc();
    uc.init(makeResolve([{ ar: own, myRole: 'subject' }], []));

    const res = await uc.execute({ userId: ALICE });
    expect(res).toHaveLength(1);
    expect(res[0]!.myRole).toBe('subject');
    expect(res[0]!.campaignId).toBe(own.state.uuid);
    expect(res[0]!.subjectId).toBe(ALICE);
  });

  test('ментор видит кампанию субъекта со своей ролью', async () => {
    const own = makeCampaign();
    const uc = new GetMyCampaignsUc();
    uc.init(makeResolve([{ ar: own, myRole: 'mentor' }], []));

    const res = await uc.execute({ userId: MENTOR });
    expect(res).toHaveLength(1);
    expect(res[0]!.myRole).toBe('mentor');
    expect(res[0]!.subjectId).toBe(ALICE);
  });

  test('прогресс M/K: мои отзывы / адресаты политики', async () => {
    const campaign = ReviewCampaignFactory.createStudentCampaign({
      scopeId: SCOPE,
      subjectId: ALICE,
      participants: [
        { userId: ALICE, role: 'student', outcome: 'completed' },
        { userId: BOB, role: 'student', outcome: 'in_progress' },
        MENTOR_P,
      ],
      now: NOW,
    });
    const reviews = makeReviews(campaign.state.uuid, [
      [ALICE, MENTOR],
      [ALICE, BOB],
      [MENTOR, ALICE],
    ]);
    const uc = new GetMyCampaignsUc();
    uc.init(makeResolve([{ ar: campaign, myRole: 'subject' }], reviews));

    const res = await uc.execute({ userId: ALICE });
    // K — адресаты политики: субъект completed → ментор + соученик in_progress;
    // M — из трёх отзывов два написаны от ALICE
    expect(res[0]!.progress).toEqual({ done: 2, total: 2 });
  });

  test('onlyLives отсекает истекшие окна', async () => {
    const live = makeCampaign();
    const expired = makeCampaign(
      COMPLETED,
      SCOPE,
      new Date('2026-09-01T10:00'),
    );
    const uc = new GetMyCampaignsUc();
    uc.init(
      makeResolve(
        [
          { ar: live, myRole: 'subject' },
          { ar: expired, myRole: 'subject' },
        ],
        [],
      ),
    );

    const all = await uc.execute({ userId: ALICE });
    expect(all).toHaveLength(2);

    const lives = await uc.execute({ userId: ALICE, onlyLives: true });
    expect(lives).toHaveLength(1);
    expect(lives[0]!.campaignId).toBe(live.state.uuid);
    expect(lives[0]!.daysLeft).toBeGreaterThan(0);
  });

  test('filter: по scopeId и по context', async () => {
    const inScope = makeCampaign();
    const otherScope = makeCampaign(COMPLETED, SCOPE2);
    const uc = new GetMyCampaignsUc();
    uc.init(
      makeResolve(
        [
          { ar: inScope, myRole: 'subject' },
          { ar: otherScope, myRole: 'subject' },
        ],
        [],
      ),
    );

    const byScope = await uc.execute({
      userId: ALICE,
      filter: { scopeId: SCOPE2 },
    });
    expect(byScope).toHaveLength(1);
    expect(byScope[0]!.scopeId).toBe(SCOPE2);

    const byContext = await uc.execute({
      userId: ALICE,
      filter: { context: 'stream_ended' },
    });
    expect(byContext).toHaveLength(2);
  });
});
