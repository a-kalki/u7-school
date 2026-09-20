import { describe, expect, mock, test } from 'bun:test';
import type {
  StreamMember,
  StreamMembers,
  StudentAbandonedEvent,
  StudentCompletedEvent,
} from '@u7-scl/stream/domain';
import type { PeerReviewApiModuleResolver } from '#domain/module';
import type { ReviewCampaign } from '#domain/review-campaign/entity';
import type { ReviewCampaignRepo } from '#domain/review-campaign/repo';
import { CreateStudentCampaignEr } from './create-student-campaign-er';

const SCOPE = '11111111-1111-4111-8111-111111111111';
const SUBJECT = '77777777-7777-4777-8777-777777777777';
const MENTOR = '66666666-6666-4666-8666-666666666666';
const CLASSMATE_LIVE = '22222222-2222-4222-8222-222222222222';
const CLASSMATE_DONE = '33333333-3333-4333-8333-333333333333';
const CLASSMATE_DROP = '44444444-4444-4444-8444-444444444444';
const CLASSMATE_NEVER = '88888888-8888-4888-8888-888888888888';

function student(
  userId: string,
  status: StreamMember['status'],
  neverStarted = false,
): StreamMember {
  return { userId, status, neverStarted };
}

/** Состав потока: субъект + соученики всех статусов + ментор. */
function makeMembers(): StreamMembers {
  return {
    mentorId: MENTOR,
    students: [
      student(SUBJECT, 'advanced'),
      student(CLASSMATE_LIVE, 'active'),
      student(CLASSMATE_DONE, 'not_advanced'),
      student(CLASSMATE_DROP, 'abandoned'),
      student(CLASSMATE_NEVER, 'abandoned', true),
    ],
  };
}

function completedEvent(
  outcome: 'advanced' | 'not_advanced' = 'advanced',
): StudentCompletedEvent {
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
      outcome,
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
    context: 'stream_fate',
    scopeId: SCOPE,
    subjectId: SUBJECT,
    createdAt: '2026-09-20T10:00',
    expiresAt: '2026-09-27T10:00',
    participants: [],
    payload: { subjectOutcome: 'dropped', mentorId: MENTOR },
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
        warn: mock((_source: string, msg: string) => warns.push(msg)),
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

describe('CreateStudentCampaignEr — подписка', () => {
  test('ER подписан на student.completed и student.abandoned', () => {
    const { er } = makeEr();
    expect([...er.getEventNames()].sort()).toEqual([
      'student.abandoned',
      'student.completed',
    ]);
  });
});

describe('CreateStudentCampaignEr — создание кампании', () => {
  test('student.completed → кампания stream_fate с ключом (scopeId, subjectId)', async () => {
    const { er, saved } = makeEr();

    await er.handle(completedEvent());

    expect(saved).toHaveLength(1);
    expect(saved[0]!.context).toBe('stream_fate');
    expect(saved[0]!.scopeId).toBe(SCOPE);
    expect(saved[0]!.subjectId).toBe(SUBJECT);
  });

  test('student.abandoned → кампания создаётся так же', async () => {
    const { er, saved } = makeEr();

    await er.handle(abandonedEvent());

    expect(saved).toHaveLength(1);
    expect(saved[0]!.subjectId).toBe(SUBJECT);
  });

  test('payload: mentorId из состава, subjectOutcome — 4-значная проекция', async () => {
    const { er, saved } = makeEr();

    await er.handle(completedEvent('advanced'));
    expect(saved[0]!.payload).toEqual({
      subjectOutcome: 'completed_passed',
      mentorId: MENTOR,
    });

    const second = makeEr();
    await second.er.handle(completedEvent('not_advanced'));
    expect(second.saved[0]!.payload.subjectOutcome).toBe(
      'completed_not_passed',
    );
  });

  test('состав participants: «завершил» → завершившиеся и ещё учащиеся, без субъекта', async () => {
    const { er, saved } = makeEr();

    await er.handle(completedEvent());

    expect(saved[0]!.participants).toEqual([CLASSMATE_LIVE, CLASSMATE_DONE]);
  });

  test('«забросил»/«не начал» → пустой participants (адресат только ментор)', async () => {
    const { er, saved } = makeEr();

    await er.handle(abandonedEvent());

    expect(saved[0]!.participants).toEqual([]);
    expect(saved[0]!.payload.subjectOutcome).toBe('dropped');
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
    expect(event.payload.context).toBe('stream_fate');
    expect(event.payload.scopeId).toBe(SCOPE);
    expect(event.payload.subjectId).toBe(SUBJECT);
  });
});

describe('CreateStudentCampaignEr — идемпотентность и деградация', () => {
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
