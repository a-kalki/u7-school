import { describe, expect, test } from 'bun:test';
import { REVIEW_WINDOW_DAYS } from './constants';
import type { CampaignParticipant } from './entity';
import { ReviewCampaignFactory } from './review-campaign-factory';

const UUIDS = {
  scope: '22222222-2222-4222-8222-222222222222',
  subject: '77777777-7777-4777-8777-777777777777',
  alice: '33333333-3333-4333-8333-333333333333',
  bob: '44444444-4444-4444-8444-444444444444',
  mentor: '55555555-5555-4555-8555-555555555555',
  /** Не входит в снапшот участников — для проверки инварианта субъекта. */
  absent: '88888888-8888-4888-8888-888888888888',
};

/** 2026-09-20T10:00 UTC */
const NOW = new Date('2026-09-20T10:00Z');

/** Снапшот окружения субъекта: субъект завершает поток. */
function participants(): CampaignParticipant[] {
  return [
    { userId: UUIDS.subject, role: 'student', outcome: 'completed' },
    { userId: UUIDS.alice, role: 'student', outcome: 'in_progress' },
    { userId: UUIDS.bob, role: 'student', outcome: 'dropped' },
    { userId: UUIDS.mentor, role: 'mentor' },
  ];
}

function createInput(
  overrides: Partial<{
    scopeId: string;
    subjectId: string;
    participants: CampaignParticipant[];
    now: Date;
  }> = {},
) {
  return {
    scopeId: UUIDS.scope,
    subjectId: UUIDS.subject,
    participants: participants(),
    now: NOW,
    ...overrides,
  };
}

describe('ReviewCampaignFactory.createStudentCampaign', () => {
  test('контекст stream_ended, скоуп и субъект кампании (ФР-2/ФР-3)', () => {
    const ar = ReviewCampaignFactory.createStudentCampaign(createInput());
    expect(ar.context).toBe('stream_ended');
    expect(ar.scopeId).toBe(UUIDS.scope);
    expect(ar.subjectId).toBe(UUIDS.subject);
  });

  test('createdAt — из переданного момента (минутная точность)', () => {
    const ar = ReviewCampaignFactory.createStudentCampaign(createInput());
    expect(ar.state.createdAt).toBe('2026-09-20T10:00');
  });

  test(`expiresAt = createdAt + ${REVIEW_WINDOW_DAYS.streamEnded} дней (из константы окна)`, () => {
    expect(REVIEW_WINDOW_DAYS.streamEnded).toBe(7);
    const ar = ReviewCampaignFactory.createStudentCampaign(createInput());
    expect(ar.state.expiresAt).toBe('2026-09-27T10:00');
  });

  test('окно сразу согласовано с агрегатом: жива, daysLeft = окну', () => {
    const ar = ReviewCampaignFactory.createStudentCampaign(createInput());
    expect(ar.isExpired(NOW)).toBe(false);
    expect(ar.daysLeft(NOW)).toBe(REVIEW_WINDOW_DAYS.streamEnded);
  });

  test('участники — снапшот без изменения порядка (вкл. in_progress)', () => {
    const ar = ReviewCampaignFactory.createStudentCampaign(createInput());
    expect(ar.participants).toEqual(participants());
  });

  test('uuid кампании генерируется', () => {
    const a = ReviewCampaignFactory.createStudentCampaign(createInput());
    const b = ReviewCampaignFactory.createStudentCampaign(createInput());
    expect(a.state.uuid).not.toBe(b.state.uuid);
  });

  test('субъект отсутствует в participants — фабрика отклоняет (инвариант)', () => {
    expect(() =>
      ReviewCampaignFactory.createStudentCampaign(
        createInput({ subjectId: UUIDS.absent }),
      ),
    ).toThrow();
  });

  test('субъект с неконечным исходом (in_progress) — фабрика отклоняет', () => {
    const live: CampaignParticipant[] = [
      { userId: UUIDS.subject, role: 'student', outcome: 'in_progress' },
      { userId: UUIDS.mentor, role: 'mentor' },
    ];
    expect(() =>
      ReviewCampaignFactory.createStudentCampaign(
        createInput({ participants: live }),
      ),
    ).toThrow();
  });

  test('студент без исхода — фабрика отклоняет (инвариант агрегата)', () => {
    const broken: CampaignParticipant[] = [
      { userId: UUIDS.subject, role: 'student', outcome: 'completed' },
      { userId: UUIDS.alice, role: 'student' },
    ];
    expect(() =>
      ReviewCampaignFactory.createStudentCampaign(
        createInput({ participants: broken }),
      ),
    ).toThrow();
  });
});

describe('ReviewCampaignFactory.restore', () => {
  test('восстанавливает кампанию stream_ended по дискриминанту', () => {
    const created = ReviewCampaignFactory.createStudentCampaign(createInput());
    const restored = ReviewCampaignFactory.restore(created.state);
    expect(restored.state).toEqual(created.state);
    expect(restored.context).toBe('stream_ended');
  });

  test('updatedAt в состоянии не вырезается при restore (штамп базового Aggregate)', () => {
    const created = ReviewCampaignFactory.createStudentCampaign(createInput());
    const restored = ReviewCampaignFactory.restore({
      ...created.state,
      updatedAt: '2026-09-21T12:00',
    });
    expect(restored.state.updatedAt).toBe('2026-09-21T12:00');
  });

  test('восстановленная кампания отвечает на вопросы окна', () => {
    const created = ReviewCampaignFactory.createStudentCampaign(createInput());
    const restored = ReviewCampaignFactory.restore(created.state);
    const almost = new Date(
      NOW.getTime() +
        (REVIEW_WINDOW_DAYS.streamEnded - 1) * 24 * 60 * 60 * 1000,
    );
    expect(restored.isExpired(almost)).toBe(false);
    expect(restored.ensureLive(almost)).toBeUndefined();
  });

  test('повреждённый контекст — инвариант агрегата', () => {
    const created = ReviewCampaignFactory.createStudentCampaign(createInput());
    const corrupted = {
      ...created.state,
      context: 'unknown_context',
    } as unknown as Parameters<typeof ReviewCampaignFactory.restore>[0];
    expect(() => ReviewCampaignFactory.restore(corrupted)).toThrow();
  });

  test('кампания создаётся с событием student-campaign.created (ФР-5)', () => {
    const ar = ReviewCampaignFactory.createStudentCampaign(createInput());

    expect(ar.hasEvents()).toBe(true);
    const [event] = ar.flushEvents();
    expect(event).toBeDefined();
    expect(event!.eventName).toBe('student-campaign.created');
    expect(event!.aggregateName).toBe('ReviewCampaign');
    expect(event!.aggregateId).toBe(ar.state.uuid);
    expect(event!.payload).toEqual({
      campaignId: ar.state.uuid,
      context: 'stream_ended',
      scopeId: UUIDS.scope,
      subjectId: UUIDS.subject,
    });
    expect(ar.hasEvents()).toBe(false); // flush — единожды
  });
});
