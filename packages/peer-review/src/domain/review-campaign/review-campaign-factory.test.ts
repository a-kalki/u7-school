import { describe, expect, test } from 'bun:test';
import { REVIEW_WINDOW_DAYS } from './constants';
import type { StudentOutcome } from './entity';
import { ReviewCampaignFactory } from './review-campaign-factory';

const UUIDS = {
  scope: '22222222-2222-4222-8222-222222222222',
  subject: '77777777-7777-4777-8777-777777777777',
  alice: '33333333-3333-4333-8333-333333333333',
  bob: '44444444-4444-4444-8444-444444444444',
  mentor: '55555555-5555-4555-8555-555555555555',
  /** Не входит в адресуемых — для негативных проверок. */
  absent: '88888888-8888-4888-8888-888888888888',
};

/** 2026-09-20T10:00 UTC */
const NOW = new Date('2026-09-20T10:00Z');

function createInput(
  overrides: Partial<{
    scopeId: string;
    subjectId: string;
    mentorId: string;
    subjectOutcome: StudentOutcome;
    participantIds: string[];
    now: Date;
  }> = {},
) {
  return {
    scopeId: UUIDS.scope,
    subjectId: UUIDS.subject,
    mentorId: UUIDS.mentor,
    subjectOutcome: 'completed_passed' as StudentOutcome,
    participantIds: [UUIDS.alice, UUIDS.bob],
    now: NOW,
    ...overrides,
  };
}

describe('ReviewCampaignFactory.createStudentCampaign', () => {
  test('контекст stream_fate, скоуп и субъект кампании', () => {
    const ar = ReviewCampaignFactory.createStudentCampaign(createInput());
    expect(ar.context).toBe('stream_fate');
    expect(ar.scopeId).toBe(UUIDS.scope);
    expect(ar.subjectId).toBe(UUIDS.subject);
  });

  test.each([
    'completed_passed',
    'completed_not_passed',
    'dropped',
    'never_started',
  ] as const)(
    'исход субъекта %s проходит в payload (создание для всех 4 исходов)',
    (subjectOutcome) => {
      const ar = ReviewCampaignFactory.createStudentCampaign(
        createInput({ subjectOutcome }),
      );
      expect(ar.state.payload.subjectOutcome).toBe(subjectOutcome);
    },
  );

  test('payload: mentorId — второй автор окна', () => {
    const ar = ReviewCampaignFactory.createStudentCampaign(createInput());
    expect(ar.state.payload.mentorId).toBe(UUIDS.mentor);
  });

  test('participants — только id адресуемых соучеников, порядок сохранён', () => {
    const ar = ReviewCampaignFactory.createStudentCampaign(createInput());
    expect(ar.state.participants).toEqual([UUIDS.alice, UUIDS.bob]);
  });

  test('пустой participants — валиден (окно для «забросил»/«не начал»)', () => {
    const ar = ReviewCampaignFactory.createStudentCampaign(
      createInput({ subjectOutcome: 'dropped', participantIds: [] }),
    );
    expect(ar.state.participants).toEqual([]);
  });

  test('createdAt — из переданного момента (минутная точность)', () => {
    const ar = ReviewCampaignFactory.createStudentCampaign(createInput());
    expect(ar.state.createdAt).toBe('2026-09-20T10:00');
  });

  test(`expiresAt = createdAt + ${REVIEW_WINDOW_DAYS.streamFate} дней (из константы окна)`, () => {
    expect(REVIEW_WINDOW_DAYS.streamFate).toBe(7);
    const ar = ReviewCampaignFactory.createStudentCampaign(createInput());
    expect(ar.state.expiresAt).toBe('2026-09-27T10:00');
  });

  test('окно сразу согласовано с агрегатом: жива, daysLeft = окну', () => {
    const ar = ReviewCampaignFactory.createStudentCampaign(createInput());
    expect(ar.isExpired(NOW)).toBe(false);
    expect(ar.daysLeft(NOW)).toBe(REVIEW_WINDOW_DAYS.streamFate);
  });

  test('uuid кампании генерируется', () => {
    const a = ReviewCampaignFactory.createStudentCampaign(createInput());
    const b = ReviewCampaignFactory.createStudentCampaign(createInput());
    expect(a.state.uuid).not.toBe(b.state.uuid);
  });

  test('субъект среди participants — фабрика отклоняет (не адресует сам себе)', () => {
    expect(() =>
      ReviewCampaignFactory.createStudentCampaign(
        createInput({ participantIds: [UUIDS.alice, UUIDS.subject] }),
      ),
    ).toThrow();
  });

  test('ментор среди participants — фабрика отклоняет (ментор — в payload)', () => {
    expect(() =>
      ReviewCampaignFactory.createStudentCampaign(
        createInput({ participantIds: [UUIDS.mentor] }),
      ),
    ).toThrow();
  });

  test('дубль id среди participants — фабрика отклоняет', () => {
    expect(() =>
      ReviewCampaignFactory.createStudentCampaign(
        createInput({ participantIds: [UUIDS.alice, UUIDS.alice] }),
      ),
    ).toThrow();
  });
});

describe('ReviewCampaignFactory.restore', () => {
  test('восстанавливает кампанию stream_fate по дискриминанту', () => {
    const created = ReviewCampaignFactory.createStudentCampaign(createInput());
    const restored = ReviewCampaignFactory.restore(created.state);
    expect(restored.state).toEqual(created.state);
    expect(restored.context).toBe('stream_fate');
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
      NOW.getTime() + (REVIEW_WINDOW_DAYS.streamFate - 1) * 24 * 60 * 60 * 1000,
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

  test('кампания создаётся с событием student-campaign.created', () => {
    const ar = ReviewCampaignFactory.createStudentCampaign(createInput());

    expect(ar.hasEvents()).toBe(true);
    const [event] = ar.flushEvents();
    expect(event).toBeDefined();
    expect(event!.eventName).toBe('student-campaign.created');
    expect(event!.aggregateName).toBe('ReviewCampaign');
    expect(event!.aggregateId).toBe(ar.state.uuid);
    expect(event!.payload).toEqual({
      campaignId: ar.state.uuid,
      context: 'stream_fate',
      scopeId: UUIDS.scope,
      subjectId: UUIDS.subject,
    });
    expect(ar.hasEvents()).toBe(false); // flush — единожды
  });
});
