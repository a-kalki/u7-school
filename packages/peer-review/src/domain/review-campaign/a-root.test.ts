import { describe, expect, test } from 'bun:test';
import { AppException } from '@u7-scl/core/domain';
import { ReviewCampaignAr } from './a-root';
import type { CampaignParticipant, ReviewCampaign } from './entity';

const UUIDS = {
  campaign: '11111111-1111-4111-8111-111111111111',
  scope: '22222222-2222-4222-8222-222222222222',
  alice: '33333333-3333-4333-8333-333333333333',
  bob: '44444444-4444-4444-8444-444444444444',
  mentor: '55555555-5555-4555-8555-555555555555',
};

const T0 = new Date('2026-09-20T10:00');
const T7 = new Date('2026-09-27T10:00');

function participants(): CampaignParticipant[] {
  return [
    { userId: UUIDS.alice, role: 'student', outcome: 'completed' },
    { userId: UUIDS.bob, role: 'student', outcome: 'never_started' },
    { userId: UUIDS.mentor, role: 'mentor' },
  ];
}

function campaignState(
  overrides: Partial<ReviewCampaign> = {},
): ReviewCampaign {
  const base: ReviewCampaign = {
    uuid: UUIDS.campaign,
    context: 'stream_completed',
    scopeId: UUIDS.scope,
    createdAt: T0.toISOString().slice(0, 16),
    expiresAt: T7.toISOString().slice(0, 16),
    participants: participants(),
    payload: {},
  };
  return { ...base, ...overrides };
}

function ar(overrides: Partial<ReviewCampaign> = {}): ReviewCampaignAr {
  return new ReviewCampaignAr(campaignState(overrides));
}

describe('ReviewCampaignAr: окно жизни', () => {
  test('свежая кампания не истекла', () => {
    expect(ar().isExpired(T0)).toBe(false);
  });

  test('за минуту до границы — ещё жива', () => {
    const almost = new Date(T7.getTime() - 60_000);
    expect(ar().isExpired(almost)).toBe(false);
  });

  test('в момент границы окно закрыто (now >= expiresAt)', () => {
    expect(ar().isExpired(T7)).toBe(true);
  });

  test('после границы — истекла', () => {
    const later = new Date(T7.getTime() + 60_000);
    expect(ar().isExpired(later)).toBe(true);
  });
});

describe('ReviewCampaignAr: daysLeft', () => {
  test('в момент создания — 7 дней', () => {
    expect(ar().daysLeft(T0)).toBe(7);
  });

  test('через полдня — округляется вверх до 7', () => {
    const t = new Date(T0.getTime() + 12 * 60 * 60 * 1000);
    expect(ar().daysLeft(t)).toBe(7);
  });

  test('осталось меньше суток — 1 день', () => {
    const t = new Date(T7.getTime() - 12 * 60 * 60 * 1000);
    expect(ar().daysLeft(t)).toBe(1);
  });

  test('истёкшая кампания — 0 дней', () => {
    expect(ar().daysLeft(T7)).toBe(0);
  });
});

describe('ReviewCampaignAr: ensureLive', () => {
  test('живая кампания — не бросает', () => {
    expect(() => ar().ensureLive(T0)).not.toThrow();
  });

  test('истёкшая — доменная ошибка «возможность закрыта»', () => {
    try {
      ar().ensureLive(T7);
      expect.unreachable('ensureLive должен бросить ошибку');
    } catch (e) {
      expect(e).toBeInstanceOf(AppException);
      const error = (e as AppException).error;
      expect(error.name).toBe('REVIEW_WINDOW_CLOSED');
      expect(error.kind).toBe('conflict');
      expect(error.payload).toEqual({
        campaignId: UUIDS.campaign,
        expiresAt: T7.toISOString().slice(0, 16),
      });
    }
  });
});

describe('ReviewCampaignAr: доступ к участникам и каркасу', () => {
  test('participants — снапшот на чтение', () => {
    expect(ar().participants).toEqual(participants());
  });

  test('findParticipant находит по userId', () => {
    const found = ar().findParticipant(UUIDS.bob);
    expect(found?.role).toBe('student');
    expect(found?.outcome).toBe('never_started');
  });

  test('findParticipant неизвестного — undefined', () => {
    expect(ar().findParticipant('99999999-9999-4999-8999-999999999999')).toBe(
      undefined,
    );
  });

  test('геттеры каркаса: scopeId, context, expiresAt', () => {
    const campaign = ar();
    expect(campaign.scopeId).toBe(UUIDS.scope);
    expect(campaign.context).toBe('stream_completed');
    expect(campaign.expiresAt).toBe(T7.toISOString().slice(0, 16));
  });
});

describe('ReviewCampaignAr: инварианты', () => {
  test('студент без исхода — нарушение инварианта', () => {
    const broken = campaignState({
      participants: [{ userId: UUIDS.alice, role: 'student' }],
    });
    expect(() => new ReviewCampaignAr(broken)).toThrow();
  });

  test('ментор с исходом — нарушение инварианта (роль, не исход)', () => {
    const broken = campaignState({
      participants: [
        { userId: UUIDS.mentor, role: 'mentor', outcome: 'completed' },
      ],
    });
    expect(() => new ReviewCampaignAr(broken)).toThrow();
  });

  test('дубль userId среди участников — нарушение инварианта', () => {
    const broken = campaignState({
      participants: [
        { userId: UUIDS.alice, role: 'student', outcome: 'completed' },
        { userId: UUIDS.alice, role: 'mentor' },
      ],
    });
    expect(() => new ReviewCampaignAr(broken)).toThrow();
  });

  test('валидное состояние — конструируется без ошибок', () => {
    expect(() => new ReviewCampaignAr(campaignState())).not.toThrow();
  });
});
