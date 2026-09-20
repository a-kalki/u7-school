import { describe, expect, test } from 'bun:test';
import { AppException } from '@u7-scl/core/domain';
import { ReviewCampaignAr } from './a-root';
import type { ReviewCampaign } from './entity';

const UUIDS = {
  campaign: '11111111-1111-4111-8111-111111111111',
  scope: '22222222-2222-4222-8222-222222222222',
  subject: '77777777-7777-4777-8777-777777777777',
  alice: '33333333-3333-4333-8333-333333333333',
  bob: '44444444-4444-4444-8444-444444444444',
  mentor: '55555555-5555-4555-8555-555555555555',
  stranger: '29999999-9999-4999-8999-999999999999',
};

const T0 = new Date('2026-09-20T10:00');
const T7 = new Date('2026-09-27T10:00');

function campaignState(
  overrides: Partial<ReviewCampaign> = {},
): ReviewCampaign {
  const base: ReviewCampaign = {
    uuid: UUIDS.campaign,
    context: 'stream_fate',
    scopeId: UUIDS.scope,
    subjectId: UUIDS.subject,
    createdAt: T0.toISOString().slice(0, 16),
    expiresAt: T7.toISOString().slice(0, 16),
    participants: [UUIDS.alice, UUIDS.bob],
    payload: { subjectOutcome: 'completed_passed', mentorId: UUIDS.mentor },
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

describe('ReviewCampaignAr: доступ к адресуемым и каркасу', () => {
  test('participants — снапшот id на чтение', () => {
    expect(ar().participants).toEqual([UUIDS.alice, UUIDS.bob]);
  });

  test('hasParticipant распознаёт адресуемого', () => {
    expect(ar().hasParticipant(UUIDS.alice)).toBe(true);
    expect(ar().hasParticipant(UUIDS.stranger)).toBe(false);
  });

  test('геттеры каркаса: scopeId, context, subjectId, expiresAt', () => {
    const campaign = ar();
    expect(campaign.scopeId).toBe(UUIDS.scope);
    expect(campaign.context).toBe('stream_fate');
    expect(campaign.subjectId).toBe(UUIDS.subject);
    expect(campaign.expiresAt).toBe(T7.toISOString().slice(0, 16));
  });

  test('payload читается через предметные геттеры', () => {
    const campaign = ar();
    expect(campaign.subjectOutcome).toBe('completed_passed');
    expect(campaign.mentorId).toBe(UUIDS.mentor);
  });

  test('isSubject распознаёт субъекта окна', () => {
    expect(ar().isSubject(UUIDS.subject)).toBe(true);
    expect(ar().isSubject(UUIDS.alice)).toBe(false);
  });
});

describe('ReviewCampaignAr: инварианты адресации', () => {
  test('дубль id среди участников — нарушение инварианта', () => {
    const broken = campaignState({
      participants: [UUIDS.alice, UUIDS.alice],
    });
    expect(() => new ReviewCampaignAr(broken)).toThrow();
  });

  test('субъект в participants — нарушение инварианта (не о себе)', () => {
    const broken = campaignState({
      participants: [UUIDS.subject, UUIDS.alice],
    });
    expect(() => new ReviewCampaignAr(broken)).toThrow();
  });

  test('ментор в participants — нарушение инварианта (ментор — в payload)', () => {
    const broken = campaignState({
      participants: [UUIDS.mentor],
    });
    expect(() => new ReviewCampaignAr(broken)).toThrow();
  });

  test('пустой participants — валиден (адресат только ментор)', () => {
    expect(
      () =>
        new ReviewCampaignAr(
          campaignState({
            participants: [],
            payload: { subjectOutcome: 'dropped', mentorId: UUIDS.mentor },
          }),
        ),
    ).not.toThrow();
  });

  test('валидное состояние — конструируется без ошибок', () => {
    expect(() => new ReviewCampaignAr(campaignState())).not.toThrow();
  });
});

describe('ReviewCampaignAr: адресация (домен вместо UC)', () => {
  test('reviewTargets субъекта — соученики + ментор (порядок сохранён)', () => {
    const { myRole, targetIds } = ar().reviewTargets(UUIDS.subject);
    expect(myRole).toBe('subject');
    expect(targetIds).toEqual([UUIDS.alice, UUIDS.bob, UUIDS.mentor]);
  });

  test('reviewTargets субъекта при пустом participants — только ментор', () => {
    const empty = ar({
      participants: [],
      payload: { subjectOutcome: 'never_started', mentorId: UUIDS.mentor },
    });
    expect(empty.reviewTargets(UUIDS.subject)).toEqual({
      myRole: 'subject',
      targetIds: [UUIDS.mentor],
    });
  });

  test('reviewTargets ментора — единственный адресат субъект', () => {
    expect(ar().reviewTargets(UUIDS.mentor)).toEqual({
      myRole: 'mentor',
      targetIds: [UUIDS.subject],
    });
  });

  test.each([
    ['адресуемый соученик', UUIDS.alice],
    ['посторонний', UUIDS.stranger],
  ])(
    'reviewTargets: %s — access-denied PEER_REVIEW_NOT_PARTICIPANT',
    (_label, userId) => {
      try {
        ar().reviewTargets(userId);
        expect.unreachable('должен бросить ошибку доступа');
      } catch (e) {
        expect(e).toBeInstanceOf(AppException);
        const error = (e as AppException).error;
        expect(error.name).toBe('PEER_REVIEW_NOT_PARTICIPANT');
        expect(error.kind).toBe('access-denied');
      }
    },
  );
});

describe('ReviewCampaignAr: assertCanWrite', () => {
  test('субъект пишет ментору — direction student_mentor + снапшот исхода', () => {
    const { direction, authorOutcome } = ar().assertCanWrite(
      UUIDS.subject,
      UUIDS.mentor,
    );
    expect(direction).toBe('student_mentor');
    expect(authorOutcome).toBe('completed_passed');
  });

  test('субъект пишет соученику — direction student_student', () => {
    const { direction, authorOutcome } = ar().assertCanWrite(
      UUIDS.subject,
      UUIDS.bob,
    );
    expect(direction).toBe('student_student');
    expect(authorOutcome).toBe('completed_passed');
  });

  test('ментор пишет субъекту — direction mentor_student, исхода автора нет', () => {
    const { direction, authorOutcome } = ar().assertCanWrite(
      UUIDS.mentor,
      UUIDS.subject,
    );
    expect(direction).toBe('mentor_student');
    expect(authorOutcome).toBeUndefined();
  });

  test.each([
    ['о себе', UUIDS.subject],
    ['посторонний адресат', UUIDS.stranger],
  ])(
    'assertCanWrite: субъект → %s — conflict PEER_REVIEW_RECIPIENT_NOT_ALLOWED',
    (_label, recipientId) => {
      try {
        ar().assertCanWrite(UUIDS.subject, recipientId);
        expect.unreachable('должен бросить конфликт адресата');
      } catch (e) {
        expect(e).toBeInstanceOf(AppException);
        const error = (e as AppException).error;
        expect(error.name).toBe('PEER_REVIEW_RECIPIENT_NOT_ALLOWED');
        expect(error.kind).toBe('conflict');
      }
    },
  );

  test('assertCanWrite: ментор пишет соученику — конфликт адресата', () => {
    try {
      ar().assertCanWrite(UUIDS.mentor, UUIDS.alice);
      expect.unreachable('должен бросить конфликт адресата');
    } catch (e) {
      const error = (e as AppException).error;
      expect(error.name).toBe('PEER_REVIEW_RECIPIENT_NOT_ALLOWED');
    }
  });

  test('assertCanWrite: соученик-автор (не субъект/ментор) — access-denied', () => {
    try {
      ar().assertCanWrite(UUIDS.alice, UUIDS.mentor);
      expect.unreachable('должен бросить ошибку доступа');
    } catch (e) {
      const error = (e as AppException).error;
      expect(error.name).toBe('PEER_REVIEW_NOT_PARTICIPANT');
    }
  });
});
