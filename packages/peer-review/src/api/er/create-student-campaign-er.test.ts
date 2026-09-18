import { describe, expect, mock, test } from 'bun:test';
import type {
  StudentAbandonedEvent,
  StudentCompletedEvent,
} from '@u7-scl/stream/domain';
import {
  type StreamMemberOutcome,
  type StreamMembers,
  StudentOutcomeCategory,
} from '@u7-scl/stream/domain';
import type { PeerReviewApiModuleResolver } from '#domain/module';
import type {
  CampaignParticipant,
  ReviewCampaign,
} from '#domain/review-campaign/entity';
import type { ReviewCampaignRepo } from '#domain/review-campaign/repo';
import { CreateStudentCampaignEr } from './create-student-campaign-er';

const SCOPE = '11111111-1111-4111-8111-111111111111';
const SUBJECT = '77777777-7777-4777-8777-777777777777';
const MENTOR = '66666666-6666-4666-8666-666666666666';

function student(
  userId: string,
  outcomeCategory: StreamMemberOutcome['outcomeCategory'],
  neverStarted = false,
): StreamMemberOutcome {
  return { userId, outcomeCategory, neverStarted };
}

/** Состав потока: субъект + соученики всех категорий + ментор. */
function makeMembers(): StreamMembers {
  return {
    mentorId: MENTOR,
    students: [
      student(SUBJECT, StudentOutcomeCategory.COMPLETED),
      student(
        '22222222-2222-4222-8222-222222222222',
        StudentOutcomeCategory.IN_PROGRESS,
      ),
      student(
        '33333333-3333-4333-8333-333333333333',
        StudentOutcomeCategory.ABANDONED,
      ),
      student(
        '44444444-4444-4444-8444-444444444444',
        StudentOutcomeCategory.ABANDONED,
        true,
      ),
    ],
  };
}

function completedEvent(): StudentCompletedEvent {
  return {
    eventId: crypto.randomUUID(),
    eventName: 'student.completed',
    occurredAt: '2026-09-20T10:00',
    aggregateName: 'Student',
    aggregateId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    payload: {
      studentId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      userId: SUBJECT,
      streamId: SCOPE,
      moduleId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      outcome: 'advanced',
    },
  };
}

function abandonedEvent(): StudentAbandonedEvent {
  return {
    eventId: crypto.randomUUID(),
    eventName: 'student.abandoned',
    occurredAt: '2026-09-20T10:00',
    aggregateName: 'Student',
    aggregateId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    payload: {
      studentId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      userId: SUBJECT,
      streamId: SCOPE,
      who: 'self',
      cause: 'voluntary',
    },
  };
}

function existingCampaign(): ReviewCampaign {
  return {
    uuid: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    context: 'stream_ended',
    scopeId: SCOPE,
    subjectId: SUBJECT,
    createdAt: '2026-09-20T10:00',
    expiresAt: '2026-09-27T10:00',
    participants: [],
    payload: {},
  };
}

interface ResolveOverrides {
  existing?: ReviewCampaign;
  members?: StreamMembers | undefined;
}

/** ER против моков репозитория, фасада stream и шины. */
function makeEr(overrides: ResolveOverrides = {}) {
  const saved: ReviewCampaign[] = [];
  const published: unknown[] = [];
  const warns: string[] = [];

  const resolve = {
    reviewCampaignRepo: {
      save: mock((c: ReviewCampaign) => {
        saved.push(c);
        return Promise.resolve();
      }),
      findBySubject: mock(() =>
        Promise.resolve(overrides.existing),
      ) as unknown as ReviewCampaignRepo['findBySubject'],
    } as unknown as ReviewCampaignRepo,
    reviewRepo: {},
    streamFacade: {
      getMembers: mock(() =>
        Promise.resolve(
          'members' in overrides ? overrides.members : makeMembers(),
        ),
      ),
    },
    appResolver: {
      logger: {
        warn: mock((msg: string) => warns.push(msg)),
        error: mock(() => {}),
        info: mock(() => {}),
      },
      mode: 'test' as const,
      eventBus: { publish: () => {} },
    },
    eventBus: {
      publish: mock((e: unknown) => published.push(e)),
    },
  };

  const er = new CreateStudentCampaignEr();
  er.init(resolve as unknown as PeerReviewApiModuleResolver);
  return { er, saved, published, warns };
}

describe('CreateStudentCampaignEr (ФР-6) — подписка', () => {
  test('ER подписан на student.completed и student.abandoned', () => {
    const { er } = makeEr();
    expect([...er.getEventNames()].sort()).toEqual([
      'student.abandoned',
      'student.completed',
    ]);
  });
});

describe('CreateStudentCampaignEr (ФР-6) — создание кампании', () => {
  test('student.completed → кампания stream_ended с ключом (scopeId, subjectId)', async () => {
    const { er, saved } = makeEr();

    await er.handle(completedEvent());

    expect(saved).toHaveLength(1);
    expect(saved[0]!.context).toBe('stream_ended');
    expect(saved[0]!.scopeId).toBe(SCOPE);
    expect(saved[0]!.subjectId).toBe(SUBJECT);
  });

  test('student.abandoned → кампания создаётся так же', async () => {
    const { er, saved } = makeEr();

    await er.handle(abandonedEvent());

    expect(saved).toHaveLength(1);
    expect(saved[0]!.subjectId).toBe(SUBJECT);
  });

  test('снапшот участников: 4-значные исходы, субъект терминален, ментор без исхода', async () => {
    const { er, saved } = makeEr();

    await er.handle(completedEvent());

    const participants = saved[0]!.participants as CampaignParticipant[];
    expect(participants).toHaveLength(5);

    const byUser = new Map(participants.map((p) => [p.userId, p]));
    expect(byUser.get(SUBJECT)).toEqual({
      userId: SUBJECT,
      role: 'student',
      outcome: 'completed',
    });
    expect(byUser.get('22222222-2222-4222-8222-222222222222')).toEqual({
      userId: '22222222-2222-4222-8222-222222222222',
      role: 'student',
      outcome: 'in_progress',
    });
    expect(byUser.get('33333333-3333-4333-8333-333333333333')).toEqual({
      userId: '33333333-3333-4333-8333-333333333333',
      role: 'student',
      outcome: 'dropped',
    });
    expect(byUser.get('44444444-4444-4444-8444-444444444444')).toEqual({
      userId: '44444444-4444-4444-8444-444444444444',
      role: 'student',
      outcome: 'never_started',
    });
    expect(byUser.get(MENTOR)).toEqual({
      userId: MENTOR,
      role: 'mentor',
    });
  });

  test('публикация события агрегата student-campaign.created', async () => {
    const { er, saved, published } = makeEr();

    await er.handle(completedEvent());

    expect(published).toHaveLength(1);
    const event = published[0] as {
      eventName: string;
      payload: Record<string, unknown>;
    };
    expect(event.eventName).toBe('student-campaign.created');
    expect(event.payload.campaignId).toBe(saved[0]!.uuid);
    expect(event.payload.context).toBe('stream_ended');
    expect(event.payload.scopeId).toBe(SCOPE);
    expect(event.payload.subjectId).toBe(SUBJECT);
  });
});

describe('CreateStudentCampaignEr (ФР-6) — идемпотентность и деградация', () => {
  test('повтор события субъекта — дубль не создаётся', async () => {
    const { er, saved, published } = makeEr({ existing: existingCampaign() });

    await er.handle(completedEvent());
    await er.handle(abandonedEvent());

    expect(saved).toHaveLength(0);
    expect(published).toHaveLength(0);
  });

  test('состав потока недоступен — warn, без save/публикации, без throw', async () => {
    const { er, saved, published, warns } = makeEr({ members: undefined });

    await expect(er.handle(completedEvent())).resolves.toBeUndefined();

    expect(saved).toHaveLength(0);
    expect(published).toHaveLength(0);
    expect(warns.length).toBeGreaterThan(0);
  });
});
