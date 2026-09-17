import { describe, expect, test } from 'bun:test';
import { REVIEW_WINDOW_DAYS } from './constants';
import type { CampaignParticipant } from './entity';
import { ReviewCampaignFactory } from './review-campaign-factory';

const UUIDS = {
  scope: '22222222-2222-4222-8222-222222222222',
  alice: '33333333-3333-4333-8333-333333333333',
  bob: '44444444-4444-4444-8444-444444444444',
  mentor: '55555555-5555-4555-8555-555555555555',
};

/** 2026-09-20T10:00 UTC */
const NOW = new Date('2026-09-20T10:00Z');

function participants(): CampaignParticipant[] {
  return [
    { userId: UUIDS.alice, role: 'student', outcome: 'completed' },
    { userId: UUIDS.bob, role: 'student', outcome: 'dropped' },
    { userId: UUIDS.mentor, role: 'mentor' },
  ];
}

describe('ReviewCampaignFactory.createStreamCompleted', () => {
  test('контекст и скоуп кампании', () => {
    const ar = ReviewCampaignFactory.createStreamCompleted(
      UUIDS.scope,
      participants(),
      NOW,
    );
    expect(ar.context).toBe('stream_completed');
    expect(ar.scopeId).toBe(UUIDS.scope);
  });

  test('createdAt — из переданного момента (минутная точность)', () => {
    const ar = ReviewCampaignFactory.createStreamCompleted(
      UUIDS.scope,
      participants(),
      NOW,
    );
    expect(ar.state.createdAt).toBe('2026-09-20T10:00');
  });

  test(`expiresAt = createdAt + ${REVIEW_WINDOW_DAYS} дней (из константы окна)`, () => {
    expect(REVIEW_WINDOW_DAYS).toBe(7);
    const ar = ReviewCampaignFactory.createStreamCompleted(
      UUIDS.scope,
      participants(),
      NOW,
    );
    expect(ar.state.expiresAt).toBe('2026-09-27T10:00');
  });

  test('окно сразу согласовано с агрегатом: жива, daysLeft = окну', () => {
    const ar = ReviewCampaignFactory.createStreamCompleted(
      UUIDS.scope,
      participants(),
      NOW,
    );
    expect(ar.isExpired(NOW)).toBe(false);
    expect(ar.daysLeft(NOW)).toBe(REVIEW_WINDOW_DAYS);
  });

  test('участники — снапшот без изменения порядка', () => {
    const ar = ReviewCampaignFactory.createStreamCompleted(
      UUIDS.scope,
      participants(),
      NOW,
    );
    expect(ar.participants).toEqual(participants());
  });

  test('uuid кампании генерируется', () => {
    const a = ReviewCampaignFactory.createStreamCompleted(
      UUIDS.scope,
      participants(),
      NOW,
    );
    const b = ReviewCampaignFactory.createStreamCompleted(
      UUIDS.scope,
      participants(),
      NOW,
    );
    expect(a.state.uuid).not.toBe(b.state.uuid);
  });

  test('студент без исхода — фабрика отклоняет (инвариант агрегата)', () => {
    const broken: CampaignParticipant[] = [
      { userId: UUIDS.alice, role: 'student' },
    ];
    expect(() =>
      ReviewCampaignFactory.createStreamCompleted(UUIDS.scope, broken, NOW),
    ).toThrow();
  });
});

describe('ReviewCampaignFactory.restore', () => {
  test('восстанавливает кампанию stream_completed по дискриминанту', () => {
    const created = ReviewCampaignFactory.createStreamCompleted(
      UUIDS.scope,
      participants(),
      NOW,
    );
    const restored = ReviewCampaignFactory.restore(created.state);
    expect(restored.state).toEqual(created.state);
    expect(restored.context).toBe('stream_completed');
  });

  test('восстановленная кампания отвечает на вопросы окна', () => {
    const created = ReviewCampaignFactory.createStreamCompleted(
      UUIDS.scope,
      participants(),
      NOW,
    );
    const restored = ReviewCampaignFactory.restore(created.state);
    const almost = new Date(
      NOW.getTime() + (REVIEW_WINDOW_DAYS - 1) * 24 * 60 * 60 * 1000,
    );
    expect(restored.isExpired(almost)).toBe(false);
    expect(restored.ensureLive(almost)).toBeUndefined();
  });

  test('повреждённый контекст — инвариант агрегата', () => {
    const created = ReviewCampaignFactory.createStreamCompleted(
      UUIDS.scope,
      participants(),
      NOW,
    );
    const corrupted = {
      ...created.state,
      context: 'unknown_context',
    } as unknown as Parameters<typeof ReviewCampaignFactory.restore>[0];
    expect(() => ReviewCampaignFactory.restore(corrupted)).toThrow();
  });
});
