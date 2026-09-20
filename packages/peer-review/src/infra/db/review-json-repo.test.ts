import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Review } from '#domain/review/entity';
import { ReviewJsonRepo } from './review-json-repo';

const UUIDS = {
  campaignA: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01',
  campaignB: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa02',
  scope1: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb01',
  scope2: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb02',
  author1: 'cccccccc-cccc-4ccc-8ccc-cccccccccc01',
  author2: 'cccccccc-cccc-4ccc-8ccc-cccccccccc02',
  recipient1: 'dddddddd-dddd-4ddd-8ddd-dddddddddd01',
  recipient2: 'dddddddd-dddd-4ddd-8ddd-dddddddddd02',
  review1: '11111111-1111-4111-8111-1111111111a1',
  review2: '22222222-2222-4222-8222-2222222222a2',
  review3: '33333333-3333-4333-8333-3333333333a3',
  review4: '44444444-4444-4444-8444-4444444444a4',
} as const;

/** Валидный отзыв с минимально необходимым составом полей. */
function makeReview(input: {
  uuid: string;
  campaignId: string;
  scopeId: string;
  authorId: string;
  recipientId: string;
  text?: string;
}): Review {
  return {
    uuid: input.uuid,
    scopeId: input.scopeId,
    campaignId: input.campaignId,
    authorId: input.authorId,
    direction: 'student_student',
    authorOutcome: 'completed_passed',
    recipientId: input.recipientId,
    text: input.text ?? 'Хороший, вдумчивый соученик',
    createdAt: '2026-06-01T00:00',
  };
}

describe('ReviewJsonRepo', () => {
  let dir: string;

  beforeAll(async () => {
    dir = await mkdtemp(join(tmpdir(), 'u7-reviews-'));
  });

  afterAll(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  test('save + findByPair: сохранение и чтение по тройке (кампания, автор, адресат)', async () => {
    const repo = new ReviewJsonRepo(join(dir, 'roundtrip.json'));
    const review = makeReview({
      uuid: UUIDS.review1,
      campaignId: UUIDS.campaignA,
      scopeId: UUIDS.scope1,
      authorId: UUIDS.author1,
      recipientId: UUIDS.recipient1,
    });

    await repo.save(review);

    expect(
      await repo.findByPair(UUIDS.campaignA, UUIDS.author1, UUIDS.recipient1),
    ).toEqual(review);
    expect(
      await repo.findByPair(UUIDS.campaignA, UUIDS.author1, UUIDS.recipient2),
    ).toBeUndefined();
  });

  test('save: повторный save той же пары (тот же uuid) — перезапись текста', async () => {
    const repo = new ReviewJsonRepo(join(dir, 'overwrite.json'));
    const review = makeReview({
      uuid: UUIDS.review1,
      campaignId: UUIDS.campaignA,
      scopeId: UUIDS.scope1,
      authorId: UUIDS.author1,
      recipientId: UUIDS.recipient1,
    });
    await repo.save(review);

    const overwritten: Review = {
      ...review,
      text: 'Перезаписанный отзыв после размышлений',
      updatedAt: '2026-06-02T10:00',
    };
    await repo.save(overwritten);

    const stored = await repo.findByPair(
      UUIDS.campaignA,
      UUIDS.author1,
      UUIDS.recipient1,
    );
    expect(stored?.text).toBe('Перезаписанный отзыв после размышлений');

    // Пара по-прежнему одна: перезапись не создала дубль
    expect(await repo.findByCampaign(UUIDS.campaignA)).toHaveLength(1);
  });

  test('save: дубль пары (кампания, автор, адресат) с другим uuid — ошибка', async () => {
    const repo = new ReviewJsonRepo(join(dir, 'unique-pair.json'));
    await repo.save(
      makeReview({
        uuid: UUIDS.review1,
        campaignId: UUIDS.campaignA,
        scopeId: UUIDS.scope1,
        authorId: UUIDS.author1,
        recipientId: UUIDS.recipient1,
      }),
    );

    const duplicate = makeReview({
      uuid: UUIDS.review2,
      campaignId: UUIDS.campaignA,
      scopeId: UUIDS.scope1,
      authorId: UUIDS.author1,
      recipientId: UUIDS.recipient1,
    });

    expect(repo.save(duplicate)).rejects.toThrow();
  });

  test('findByCampaign: все отзывы кампании, чужие кампании не попадают', async () => {
    const repo = new ReviewJsonRepo(join(dir, 'by-campaign.json'));
    await repo.save(
      makeReview({
        uuid: UUIDS.review1,
        campaignId: UUIDS.campaignA,
        scopeId: UUIDS.scope1,
        authorId: UUIDS.author1,
        recipientId: UUIDS.recipient1,
      }),
    );
    await repo.save(
      makeReview({
        uuid: UUIDS.review2,
        campaignId: UUIDS.campaignA,
        scopeId: UUIDS.scope1,
        authorId: UUIDS.author2,
        recipientId: UUIDS.recipient1,
      }),
    );
    await repo.save(
      makeReview({
        uuid: UUIDS.review3,
        campaignId: UUIDS.campaignB,
        scopeId: UUIDS.scope1,
        authorId: UUIDS.author1,
        recipientId: UUIDS.recipient2,
      }),
    );

    const result = await repo.findByCampaign(UUIDS.campaignA);
    expect(result.map((r) => r.uuid).sort()).toEqual([
      UUIDS.review1,
      UUIDS.review2,
    ]);
  });

  test('findByCampaignAndAuthor: только отзывы автора в кампании', async () => {
    const repo = new ReviewJsonRepo(join(dir, 'by-author.json'));
    await repo.save(
      makeReview({
        uuid: UUIDS.review1,
        campaignId: UUIDS.campaignA,
        scopeId: UUIDS.scope1,
        authorId: UUIDS.author1,
        recipientId: UUIDS.recipient1,
      }),
    );
    await repo.save(
      makeReview({
        uuid: UUIDS.review2,
        campaignId: UUIDS.campaignA,
        scopeId: UUIDS.scope1,
        authorId: UUIDS.author1,
        recipientId: UUIDS.recipient2,
      }),
    );
    await repo.save(
      makeReview({
        uuid: UUIDS.review3,
        campaignId: UUIDS.campaignA,
        scopeId: UUIDS.scope1,
        authorId: UUIDS.author2,
        recipientId: UUIDS.recipient1,
      }),
    );
    // Тот же автор, но другая кампания — не попадает
    await repo.save(
      makeReview({
        uuid: UUIDS.review4,
        campaignId: UUIDS.campaignB,
        scopeId: UUIDS.scope1,
        authorId: UUIDS.author1,
        recipientId: UUIDS.recipient1,
      }),
    );

    const result = await repo.findByCampaignAndAuthor(
      UUIDS.campaignA,
      UUIDS.author1,
    );
    expect(result.map((r) => r.uuid).sort()).toEqual([
      UUIDS.review1,
      UUIDS.review2,
    ]);
  });

  test('findByScope: все отзывы скоупа (денормализация scopeId)', async () => {
    const repo = new ReviewJsonRepo(join(dir, 'by-scope.json'));
    await repo.save(
      makeReview({
        uuid: UUIDS.review1,
        campaignId: UUIDS.campaignA,
        scopeId: UUIDS.scope1,
        authorId: UUIDS.author1,
        recipientId: UUIDS.recipient1,
      }),
    );
    await repo.save(
      makeReview({
        uuid: UUIDS.review3,
        campaignId: UUIDS.campaignB,
        scopeId: UUIDS.scope1,
        authorId: UUIDS.author1,
        recipientId: UUIDS.recipient2,
      }),
    );
    await repo.save(
      makeReview({
        uuid: UUIDS.review2,
        campaignId: UUIDS.campaignA,
        scopeId: UUIDS.scope2,
        authorId: UUIDS.author2,
        recipientId: UUIDS.recipient1,
      }),
    );

    const result = await repo.findByScope(UUIDS.scope1);
    expect(result.map((r) => r.uuid).sort()).toEqual([
      UUIDS.review1,
      UUIDS.review3,
    ]);
  });
});
