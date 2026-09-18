import { describe, expect, test } from 'bun:test';
import * as v from 'valibot';
import {
  CampaignParticipantSchema,
  CampaignRoleSchema,
  ParticipantOutcomeSchema,
  ReviewCampaignSchema,
} from './entity';

const UUIDS = {
  campaign: '11111111-1111-4111-8111-111111111111',
  scope: '22222222-2222-4222-8222-222222222222',
  subject: '77777777-7777-4777-8777-777777777777',
  user1: '33333333-3333-4333-8333-333333333333',
  user2: '44444444-4444-4444-8444-444444444444',
};

function participant(overrides: Record<string, unknown> = {}) {
  return {
    userId: UUIDS.user1,
    role: 'student',
    outcome: 'completed',
    ...overrides,
  };
}

function campaign(overrides: Record<string, unknown> = {}) {
  return {
    uuid: UUIDS.campaign,
    context: 'stream_ended',
    scopeId: UUIDS.scope,
    subjectId: UUIDS.subject,
    createdAt: '2026-09-20T10:00',
    expiresAt: '2026-09-27T10:00',
    participants: [participant()],
    payload: {},
    ...overrides,
  };
}

describe('CampaignRoleSchema', () => {
  test('принимает student и mentor', () => {
    expect(v.safeParse(CampaignRoleSchema, 'student').success).toBe(true);
    expect(v.safeParse(CampaignRoleSchema, 'mentor').success).toBe(true);
  });

  test('отклоняет неизвестную роль', () => {
    expect(v.safeParse(CampaignRoleSchema, 'teacher').success).toBe(false);
  });
});

describe('ParticipantOutcomeSchema', () => {
  test('принимает четыре исхода-проекции (ФР-2: + in_progress)', () => {
    expect(v.safeParse(ParticipantOutcomeSchema, 'completed').success).toBe(
      true,
    );
    expect(v.safeParse(ParticipantOutcomeSchema, 'in_progress').success).toBe(
      true,
    );
    expect(v.safeParse(ParticipantOutcomeSchema, 'dropped').success).toBe(true);
    expect(v.safeParse(ParticipantOutcomeSchema, 'never_started').success).toBe(
      true,
    );
  });

  test('отклоняет сырой статус студента', () => {
    // Сырые статусы (advanced, abandoned, …) в кампанию не попадают (ФР-3)
    expect(v.safeParse(ParticipantOutcomeSchema, 'advanced').success).toBe(
      false,
    );
    expect(v.safeParse(ParticipantOutcomeSchema, 'abandoned').success).toBe(
      false,
    );
  });
});

describe('CampaignParticipantSchema', () => {
  test('валидный студент с исходом', () => {
    const result = v.safeParse(CampaignParticipantSchema, participant());
    expect(result.success).toBe(true);
  });

  test('студент «ещё учился» (in_progress) — валиден', () => {
    const result = v.safeParse(
      CampaignParticipantSchema,
      participant({ outcome: 'in_progress' }),
    );
    expect(result.success).toBe(true);
  });

  test('валидный ментор без исхода', () => {
    const result = v.safeParse(
      CampaignParticipantSchema,
      participant({ role: 'mentor', outcome: undefined }),
    );
    expect(result.success).toBe(true);
  });

  test('отклоняет не-UUID userId', () => {
    const result = v.safeParse(
      CampaignParticipantSchema,
      participant({ userId: 'not-a-uuid' }),
    );
    expect(result.success).toBe(false);
  });

  test('отклоняет неизвестную роль', () => {
    const result = v.safeParse(
      CampaignParticipantSchema,
      participant({ role: 'admin' }),
    );
    expect(result.success).toBe(false);
  });
});

describe('ReviewCampaignSchema', () => {
  test('валидная кампания stream_ended с субъектом (ФР-2)', () => {
    const result = v.safeParse(ReviewCampaignSchema, campaign());
    expect(result.success).toBe(true);
  });

  test('subjectId обязателен и должен быть UUID', () => {
    expect(
      v.safeParse(ReviewCampaignSchema, campaign({ subjectId: 'x' })).success,
    ).toBe(false);
    expect(
      v.safeParse(ReviewCampaignSchema, { ...campaign(), subjectId: undefined })
        .success,
    ).toBe(false);
  });

  test('каркас: uuid/scopeId/окно/участники обязательны', () => {
    expect(
      v.safeParse(ReviewCampaignSchema, campaign({ uuid: 'x' })).success,
    ).toBe(false);
    expect(
      v.safeParse(ReviewCampaignSchema, campaign({ scopeId: 'x' })).success,
    ).toBe(false);
    expect(
      v.safeParse(ReviewCampaignSchema, {
        ...campaign(),
        expiresAt: undefined,
      }).success,
    ).toBe(false);
    expect(
      v.safeParse(ReviewCampaignSchema, {
        ...campaign(),
        participants: undefined,
      }).success,
    ).toBe(false);
  });

  test('payload обязателен (типизирован по контексту)', () => {
    expect(
      v.safeParse(ReviewCampaignSchema, { ...campaign(), payload: undefined })
        .success,
    ).toBe(false);
  });

  test('старый контекст stream_completed больше не валиден (ФР-2)', () => {
    expect(
      v.safeParse(
        ReviewCampaignSchema,
        campaign({ context: 'stream_completed' }),
      ).success,
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

  test('несколько участников сохраняются в снапшоте (вкл. in_progress)', () => {
    const result = v.safeParse(
      ReviewCampaignSchema,
      campaign({
        participants: [
          participant({ userId: UUIDS.subject }),
          participant({ userId: UUIDS.user2, outcome: 'in_progress' }),
          participant({
            userId: UUIDS.scope,
            role: 'mentor',
            outcome: undefined,
          }),
        ],
      }),
    );
    expect(result.success).toBe(true);
  });
});
