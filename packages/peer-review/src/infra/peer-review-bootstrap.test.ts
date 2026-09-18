import { afterAll, beforeAll, describe, expect, mock, test } from 'bun:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { User } from '@u7-scl/app';
import type { AppResolver } from '@u7-scl/core/domain';
import { InProcEventBus } from '@u7-scl/core/infra';
import type { Logger } from '@u7-scl/core/shared';
import type {
  StreamFacade,
  StreamMembers,
  StudentCompletedEvent,
} from '@u7-scl/stream/domain';
import { StudentOutcomeCategory } from '@u7-scl/stream/domain';
import { peerReviewBootstrap } from './peer-review-bootstrap';

const SCOPE = '11111111-1111-4111-8111-111111111111';
const SUBJECT = '77777777-7777-4777-8777-777777777777';
const MENTOR = '66666666-6666-4666-8666-666666666666';

const ACTOR = { uuid: SUBJECT } as unknown as User;

const SILENT_LOGGER = {
  info: mock(() => {}),
  warn: mock(() => {}),
  error: mock(() => {}),
} as unknown as Logger;

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

function members(): StreamMembers {
  return {
    mentorId: MENTOR,
    students: [
      {
        userId: SUBJECT,
        outcomeCategory: StudentOutcomeCategory.COMPLETED,
        neverStarted: false,
      },
    ],
  };
}

/** Шина InProc — fire-and-forget, состояние после publish ждём поллингом. */
async function waitUntil(
  probe: () => Promise<boolean>,
  timeoutMs = 1000,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    if (await probe()) return;
    if (Date.now() > deadline) {
      throw new Error('waitUntil: состояние не наступило за отведённое время');
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

describe('peerReviewBootstrap (Фаза 5 — сборка модуля)', () => {
  let dir: string;

  beforeAll(async () => {
    dir = await mkdtemp(join(tmpdir(), 'u7-peer-review-bootstrap-'));
  });

  afterAll(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  test('bootstrap собирает модуль и фасад; ER работает через шину приложения', async () => {
    const eventBus = new InProcEventBus();
    const appResolver: AppResolver = {
      logger: SILENT_LOGGER,
      mode: 'test' as const,
      eventBus,
    };
    const streamFacade = {
      getMembers: mock(() => Promise.resolve(members())),
    } as unknown as StreamFacade;

    const { module, facade } = peerReviewBootstrap({
      dbDir: dir,
      streamFacade,
      appResolver,
    });

    expect(module.name).toBe('peer-review');
    expect(facade).toBeDefined();

    // init() подписывает ER на события судьбы студента
    module.init();
    eventBus.publish(completedEvent());

    // Кампания создана → фасад видит живое окно субъекта
    await waitUntil(() => facade.hasLiveCampaigns(SUBJECT, ACTOR));
    // А ментор в этой кампании — соавтор, тоже видит
    await waitUntil(() => facade.hasLiveCampaigns(MENTOR, ACTOR));
  });
});
