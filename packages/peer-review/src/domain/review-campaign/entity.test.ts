import { describe, expect, test } from 'bun:test';
import * as v from 'valibot';
import {
  CampaignContextSchema,
  ReviewCampaignSchema,
  StreamFatePayloadSchema,
  StudentOutcomeSchema,
} from './entity';

const UUIDS = {
  campaign: '11111111-1111-4111-8111-111111111111',
  scope: '22222222-2222-4222-8222-222222222222',
  subject: '77777777-7777-4777-8777-777777777777',
  mentor: '55555555-5555-4555-8555-555555555555',
  user1: '33333333-3333-4333-8333-333333333333',
  user2: '44444444-4444-4444-8444-444444444444',
};

/** Валидный payload окна судьбы — задаётся по варианту исхода. */
function payload(overrides: Record<string, unknown> = {}) {
  return {
    subjectOutcome: 'completed_passed',
    mentorId: UUIDS.mentor,
    ...overrides,
  };
}

function campaign(overrides: Record<string, unknown> = {}) {
  return {
    uuid: UUIDS.campaign,
    context: 'stream_fate',
    scopeId: UUIDS.scope,
    subjectId: UUIDS.subject,
    createdAt: '2026-09-20T10:00',
    expiresAt: '2026-09-27T10:00',
    participants: [UUIDS.user1, UUIDS.user2],
    payload: payload(),
    ...overrides,
  };
}

describe('StudentOutcomeSchema — 4-значная проекция исходов (ФР-1)', () => {
  test('принимает ровно четыре исхода судьбы студента', () => {
    expect(v.safeParse(StudentOutcomeSchema, 'completed_passed').success).toBe(
      true,
    );
    expect(
      v.safeParse(StudentOutcomeSchema, 'completed_not_passed').success,
    ).toBe(true);
    expect(v.safeParse(StudentOutcomeSchema, 'dropped').success).toBe(true);
    expect(v.safeParse(StudentOutcomeSchema, 'never_started').success).toBe(
      true,
    );
  });

  test('«ещё учится» не хранится: in_progress отклоняется', () => {
    expect(v.safeParse(StudentOutcomeSchema, 'in_progress').success).toBe(
      false,
    );
  });

  test('отклоняет сырые статусы и старые значения', () => {
    // Сырые статусы (advanced, abandoned, …) и склеенный completed
    // в проекцию не попадают (ФР-1/ФР-2)
    expect(v.safeParse(StudentOutcomeSchema, 'completed').success).toBe(false);
    expect(v.safeParse(StudentOutcomeSchema, 'advanced').success).toBe(false);
    expect(v.safeParse(StudentOutcomeSchema, 'abandoned').success).toBe(false);
  });
});

describe('CampaignContextSchema', () => {
  test('принимает stream_fate', () => {
    expect(v.safeParse(CampaignContextSchema, 'stream_fate').success).toBe(
      true,
    );
  });

  test('старый контекст stream_ended больше не валиден', () => {
    expect(v.safeParse(CampaignContextSchema, 'stream_ended').success).toBe(
      false,
    );
  });
});

describe('StreamFatePayloadSchema', () => {
  test('валиден: subjectOutcome + mentorId', () => {
    expect(v.safeParse(StreamFatePayloadSchema, payload()).success).toBe(true);
  });

  test('subjectOutcome обязателен', () => {
    const { subjectOutcome: _drop, ...rest } = payload();
    expect(v.safeParse(StreamFatePayloadSchema, rest).success).toBe(false);
  });

  test('mentorId обязателен и должен быть UUID', () => {
    expect(
      v.safeParse(StreamFatePayloadSchema, payload({ mentorId: 'x' })).success,
    ).toBe(false);
    expect(
      v.safeParse(StreamFatePayloadSchema, payload({ mentorId: undefined }))
        .success,
    ).toBe(false);
  });
});

describe('ReviewCampaignSchema — форма кампании (ФР-3)', () => {
  test('валидная кампания stream_fate: участники — только id соучеников', () => {
    const result = v.safeParse(ReviewCampaignSchema, campaign());
    expect(result.success).toBe(true);
  });

  test('participants — uuid[], без статусов и ролей (списочная модель удалена)', () => {
    const result = v.safeParse(
      ReviewCampaignSchema,
      campaign({
        participants: [{ userId: UUIDS.user1, role: 'student' }],
      }),
    );
    expect(result.success).toBe(false);
  });

  test('пустой participants — валиден (адресат только ментор)', () => {
    const result = v.safeParse(
      ReviewCampaignSchema,
      campaign({ participants: [] }),
    );
    expect(result.success).toBe(true);
  });

  test('participantIds — только UUID', () => {
    expect(
      v.safeParse(ReviewCampaignSchema, campaign({ participants: ['x'] }))
        .success,
    ).toBe(false);
  });

  test('subjectId/scopeId/uuid обязательны и UUID', () => {
    expect(
      v.safeParse(ReviewCampaignSchema, campaign({ subjectId: 'x' })).success,
    ).toBe(false);
    expect(
      v.safeParse(ReviewCampaignSchema, { ...campaign(), subjectId: undefined })
        .success,
    ).toBe(false);
    expect(
      v.safeParse(ReviewCampaignSchema, campaign({ scopeId: 'x' })).success,
    ).toBe(false);
    expect(
      v.safeParse(ReviewCampaignSchema, campaign({ uuid: 'x' })).success,
    ).toBe(false);
  });

  test('payload обязателен (типизирован по контексту)', () => {
    expect(
      v.safeParse(ReviewCampaignSchema, { ...campaign(), payload: undefined })
        .success,
    ).toBe(false);
  });

  test('неизвестный контекст отклоняется', () => {
    expect(
      v.safeParse(ReviewCampaignSchema, campaign({ context: 'exit' })).success,
    ).toBe(false);
  });

  test('даты в isoDateTime-формате', () => {
    expect(
      v.safeParse(ReviewCampaignSchema, campaign({ createdAt: '20.09.2026' }))
        .success,
    ).toBe(false);
    expect(
      v.safeParse(ReviewCampaignSchema, campaign({ expiresAt: 'завтра' }))
        .success,
    ).toBe(false);
  });
});
