import { afterEach, describe, expect, mock, test } from 'bun:test';
import { InProcEventBus } from '@u7-scl/core/infra';
import type { Logger } from '@u7-scl/core/shared';
import type { StudentAbandonedEvent } from '@u7-scl/stream/domain';
import type { UserFacade } from '@u7-scl/user/domain';
import type { Api } from 'grammy';
import { registerStudentKickHandler } from './student-kick-handler';

const STREAM_ID = '77777777-7777-4777-8777-777777777777';
const STUDENT_USER_ID = '11111111-1111-4111-8111-111111111111';
const GROUP_ID = '-1002222222222';

function makeEvent(
  overrides: Partial<StudentAbandonedEvent['payload']> = {},
): StudentAbandonedEvent {
  return {
    eventId: crypto.randomUUID(),
    eventName: 'student.abandoned',
    occurredAt: '2026-08-30T19:00',
    aggregateName: 'Student',
    aggregateId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    payload: {
      studentId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      userId: STUDENT_USER_ID,
      streamId: STREAM_ID,
      who: 'self',
      cause: 'voluntary',
      ...overrides,
    },
  };
}

interface KickMocks {
  eventBus: InProcEventBus;
  banChatMember: ReturnType<typeof mock>;
  unbanChatMember: ReturnType<typeof mock>;
  getStream: ReturnType<typeof mock>;
  getUserByUuid: ReturnType<typeof mock>;
  warnings: string[];
}

function setup(options?: {
  telegramGroupId?: string | undefined;
  studentTelegramId?: number | undefined;
}): { mocks: KickMocks; unsubscribe: () => void } {
  const eventBus = new InProcEventBus();
  const banChatMember = mock(async () => true);
  const unbanChatMember = mock(async () => true);
  const warnings: string[] = [];
  const logger = {
    info: () => {},
    warn: (_src: string, msg: string) => warnings.push(msg),
    error: () => {},
  } as unknown as Logger;

  const mocks: KickMocks = {
    eventBus,
    banChatMember,
    unbanChatMember,
    warnings,
    getStream: mock(async () => ({
      uuid: STREAM_ID,
      title: 'JS Core',
      telegramGroupId: options?.telegramGroupId,
      mentorId: '66666666-6666-4666-8666-666666666666',
    })),
    getUserByUuid: mock(async () =>
      options?.studentTelegramId === undefined
        ? undefined
        : {
            uuid: STUDENT_USER_ID,
            name: 'Студент',
            telegramId: options.studentTelegramId,
            roles: [],
            createdAt: '',
          },
    ),
  };

  const unsubscribe = registerStudentKickHandler({
    eventBus,
    getStream: mocks.getStream,
    userFacade: { getUserByUuid: mocks.getUserByUuid } as unknown as UserFacade,
    botApi: {
      banChatMember,
      unbanChatMember,
    } as unknown as Api,
    logger,
  });

  return { mocks, unsubscribe };
}

describe('registerStudentKickHandler (ER кика из TG-группы)', () => {
  const unsubscribers: Array<() => void> = [];

  afterEach(() => {
    for (const fn of unsubscribers) fn();
    unsubscribers.length = 0;
  });

  test('student.abandoned → banChatMember + unbanChatMember по telegramGroupId', async () => {
    const { mocks, unsubscribe } = setup({
      telegramGroupId: GROUP_ID,
      studentTelegramId: 1003,
    });
    unsubscribers.push(unsubscribe);

    mocks.eventBus.publish(makeEvent());
    // Обработчик async — даём микрозадачам выполниться
    await new Promise((r) => setTimeout(r, 10));

    expect(mocks.banChatMember).toHaveBeenCalledWith(
      GROUP_ID,
      1003,
      expect.objectContaining({ until_date: expect.any(Number) }),
    );
    expect(mocks.unbanChatMember).toHaveBeenCalledWith(GROUP_ID, 1003);
    expect(mocks.warnings).toEqual([]);
  });

  test('у потока нет группы — кик пропускается с записью в лог, без ошибки', async () => {
    const { mocks, unsubscribe } = setup({
      telegramGroupId: undefined,
      studentTelegramId: 1003,
    });
    unsubscribers.push(unsubscribe);

    mocks.eventBus.publish(makeEvent());
    await new Promise((r) => setTimeout(r, 10));

    expect(mocks.banChatMember).not.toHaveBeenCalled();
    expect(mocks.warnings.length).toBeGreaterThan(0);
  });

  test('бот не админ (banChatMember падает) — запись в лог, снятие с учёбы не ломается', async () => {
    const { mocks, unsubscribe } = setup({
      telegramGroupId: GROUP_ID,
      studentTelegramId: 1003,
    });
    unsubscribers.push(unsubscribe);
    mocks.banChatMember.mockImplementation(async () => {
      throw new Error('Bad Request: not enough rights');
    });

    expect(() => mocks.eventBus.publish(makeEvent())).not.toThrow();
    await new Promise((r) => setTimeout(r, 10));

    expect(mocks.unbanChatMember).not.toHaveBeenCalled();
    expect(mocks.warnings.length).toBeGreaterThan(0);
  });

  test('пользователь без telegramId — кик пропускается', async () => {
    const { mocks, unsubscribe } = setup({
      telegramGroupId: GROUP_ID,
      studentTelegramId: undefined,
    });
    unsubscribers.push(unsubscribe);

    mocks.eventBus.publish(makeEvent());
    await new Promise((r) => setTimeout(r, 10));

    expect(mocks.banChatMember).not.toHaveBeenCalled();
  });

  test('другие события не вызывают кик', async () => {
    const { mocks, unsubscribe } = setup({
      telegramGroupId: GROUP_ID,
      studentTelegramId: 1003,
    });
    unsubscribers.push(unsubscribe);

    mocks.eventBus.publish({
      ...makeEvent(),
      eventName: 'student.enrolled',
    } as never);
    await new Promise((r) => setTimeout(r, 10));

    expect(mocks.banChatMember).not.toHaveBeenCalled();
  });
});
