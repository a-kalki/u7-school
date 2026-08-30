import { describe, expect, mock, test } from 'bun:test';
import type { Logger } from '@u7-scl/core/shared';
import type { UserFacade } from '@u7-scl/user/domain';
import { type GroupHandlerDeps, registerGroupHandlers } from './group-handler';

// ══ Моки ══

const GROUP_ID = -1002222222222;
const STUDENT_TG = 1003;
const STUDENT_UUID = '33333333-3333-3333-3333-333333333333';
const MENTOR_UUID = '44444444-4444-4444-4444-444444444444';
const STREAM_ID = 'e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1';
const BOT_ACTOR_UUID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const NEW_USER_UUID = '77777777-7777-4777-8777-777777777777';

interface HandlerBag {
  chat_member?: (ctx: unknown) => Promise<void>;
  my_chat_member?: (ctx: unknown) => Promise<void>;
  [event: string]: ((ctx: unknown) => Promise<void>) | undefined;
}

function makeBot() {
  const handlers: HandlerBag = {};
  return {
    handlers,
    bot: {
      on: (event: string, cb: (ctx: unknown) => Promise<void>) => {
        handlers[event] = cb;
      },
    } as never,
  };
}

function makeUserFacade(opts?: { mentorTelegramId?: number }) {
  return {
    getUserByTelegramId: mock(async (tgId: number) => {
      if (tgId === STUDENT_TG) {
        return {
          uuid: STUDENT_UUID,
          name: 'Иван Студент',
          telegramId: STUDENT_TG,
          roles: ['STUDENT'],
          createdAt: '',
        };
      }
      return undefined;
    }),
    getUserByUuid: mock(async (uuid: string) => {
      if (uuid === MENTOR_UUID) {
        return {
          uuid,
          name: 'Мария Ментор',
          telegramId: opts?.mentorTelegramId ?? 1004,
          roles: ['MENTOR'],
          createdAt: '',
        };
      }
      if (uuid === STUDENT_UUID) {
        return {
          uuid,
          name: 'Иван Студент',
          telegramId: STUDENT_TG,
          roles: ['STUDENT'],
          createdAt: '',
        };
      }
      return undefined;
    }),
    addRoleToUser: mock(async () => {}),
    removeRoleFromUser: mock(async () => {}),
  } as unknown as UserFacade;
}

function makeChatMemberContext(
  newStatus: string,
  oldStatus = 'member',
  chatId: number | string = GROUP_ID,
  user: { id: number; first_name: string } = {
    id: STUDENT_TG,
    first_name: 'Иван',
  },
) {
  return {
    chatMember: {
      chat: { id: chatId },
      from: { id: 999 },
      old_chat_member: { status: oldStatus },
      new_chat_member: { status: newStatus, user },
    },
  };
}

const logger = {
  info: () => {},
  warn: () => {},
  error: () => {},
} as unknown as Logger;

// ══ Тесты FR-7 ══

describe('registerGroupHandlers — chat_member left (FR-7)', () => {
  test('студент покинул группу → ментору потока приходит уведомление, статус студента не меняется', async () => {
    const { bot, handlers } = makeBot();
    const userFacade = makeUserFacade();
    const notify = mock(async () => {});
    const execute = mock(async (name: string) => {
      if (name === 'list-streams') {
        return [
          {
            uuid: STREAM_ID,
            title: 'JS Core — Поток 2',
            mentorId: MENTOR_UUID,
            telegramGroupId: String(GROUP_ID),
          },
        ];
      }
      if (name === 'list-stream-students') {
        return [
          {
            uuid: 'f0f0f0f0-f0f0-f0f0-f0f0-f0f0f0f0f0f0',
            streamId: STREAM_ID,
            userId: STUDENT_UUID,
            status: 'active',
          },
        ];
      }
      if (name === 'get-user') {
        return {
          uuid: MENTOR_UUID,
          name: 'Мария Ментор',
          telegramId: 1004,
          roles: ['MENTOR'],
          createdAt: '',
        };
      }
      return undefined;
    });

    registerGroupHandlers(bot, userFacade, logger, {
      apiApp: { execute } as unknown as GroupHandlerDeps['apiApp'],
      transport: { notify } as unknown as GroupHandlerDeps['transport'],
      actorId: BOT_ACTOR_UUID,
    });

    await handlers.chat_member?.(makeChatMemberContext('left'));

    expect(notify).toHaveBeenCalledTimes(1);
    const firstCall = (notify as ReturnType<typeof mock>).mock.calls[0]!;
    const [tgId, payload] = firstCall;
    expect(tgId).toBe(1004);
    expect(payload.text).toContain('Иван Студент');
    expect(payload.text).toContain('покинул группу');

    // Статус студента не меняется: только read-запросы, никаких команд
    const ucNames = (execute as ReturnType<typeof mock>).mock.calls.map(
      (c) => c[0],
    );
    expect(ucNames).toEqual([
      'list-streams',
      'list-stream-students',
      'get-user',
    ]);
    expect(ucNames).not.toContain('drop-student');
    expect(ucNames).not.toContain('mark-abandoned');
  });

  test('выход не-студента потока (нет активной записи) — ментору ничего не приходит', async () => {
    const { bot, handlers } = makeBot();
    const userFacade = makeUserFacade();
    const notify = mock(async () => {});
    const execute = mock(
      async (name: string, _params?: Record<string, unknown>) => {
        if (name === 'list-streams') {
          return [
            {
              uuid: STREAM_ID,
              mentorId: MENTOR_UUID,
              telegramGroupId: String(GROUP_ID),
            },
          ];
        }
        if (name === 'list-stream-students') return [];
        return undefined;
      },
    );

    registerGroupHandlers(bot, userFacade, logger, {
      apiApp: { execute } as unknown as GroupHandlerDeps['apiApp'],
      transport: { notify } as unknown as GroupHandlerDeps['transport'],
      actorId: BOT_ACTOR_UUID,
    });

    await handlers.chat_member?.(makeChatMemberContext('left'));

    expect(notify).not.toHaveBeenCalled();
  });

  test('выход из чужой группы (не потока) — ментору ничего не приходит', async () => {
    const { bot, handlers } = makeBot();
    const userFacade = makeUserFacade();
    const notify = mock(async () => {});
    const execute = mock(
      async (name: string, _params?: Record<string, unknown>) => {
        if (name === 'list-streams') {
          return [
            {
              uuid: STREAM_ID,
              mentorId: MENTOR_UUID,
              telegramGroupId: String(GROUP_ID),
            },
          ];
        }
        return undefined;
      },
    );

    registerGroupHandlers(bot, userFacade, logger, {
      apiApp: { execute } as unknown as GroupHandlerDeps['apiApp'],
      transport: { notify } as unknown as GroupHandlerDeps['transport'],
      actorId: BOT_ACTOR_UUID,
    });

    // Другой chat id
    await handlers.chat_member?.(
      makeChatMemberContext('left', 'member', -1009999999999),
    );

    expect(notify).not.toHaveBeenCalled();
  });

  test('выбывший (abandoned) студент выходит — ментору ничего не приходит', async () => {
    const { bot, handlers } = makeBot();
    const userFacade = makeUserFacade();
    const notify = mock(async () => {});
    const execute = mock(
      async (name: string, _params?: Record<string, unknown>) => {
        if (name === 'list-streams') {
          return [
            {
              uuid: STREAM_ID,
              mentorId: MENTOR_UUID,
              telegramGroupId: String(GROUP_ID),
            },
          ];
        }
        if (name === 'list-stream-students') {
          return [
            {
              uuid: 'f0f0f0f0-f0f0-f0f0-f0f0-f0f0f0f0f0f0',
              streamId: STREAM_ID,
              userId: STUDENT_UUID,
              status: 'abandoned',
            },
          ];
        }
        return undefined;
      },
    );

    registerGroupHandlers(bot, userFacade, logger, {
      apiApp: { execute } as unknown as GroupHandlerDeps['apiApp'],
      transport: { notify } as unknown as GroupHandlerDeps['transport'],
      actorId: BOT_ACTOR_UUID,
    });

    await handlers.chat_member?.(makeChatMemberContext('left'));

    expect(notify).not.toHaveBeenCalled();
  });
});

// ══ Тесты регистрации гостей ══

describe('registerGroupHandlers — регистрация гостей', () => {
  test('незнакомый пользователь вошёл в группу → регистрируется как гость от имени бота и получает SUBSCRIBER', async () => {
    const { bot, handlers } = makeBot();
    const registerGuest = mock(async (tgId: number, name: string) => ({
      uuid: NEW_USER_UUID,
      name,
      telegramId: tgId,
      roles: ['GUEST'],
      createdAt: '',
    }));
    const addRoleToUser = mock(async () => {});
    const userFacade = {
      getUserByTelegramId: mock(async () => undefined),
      registerGuest,
      addRoleToUser,
      removeRoleFromUser: mock(async () => {}),
    } as unknown as UserFacade;

    registerGroupHandlers(bot, userFacade, logger, {
      apiApp: {
        execute: mock(async () => []),
      } as unknown as GroupHandlerDeps['apiApp'],
      transport: {
        notify: mock(async () => {}),
      } as unknown as GroupHandlerDeps['transport'],
      actorId: BOT_ACTOR_UUID,
    });

    await handlers.chat_member?.(
      makeChatMemberContext('member', 'left', GROUP_ID, {
        id: 555,
        first_name: 'Анна',
      }),
    );

    expect(registerGuest).toHaveBeenCalledTimes(1);
    const [tgId, name, actorId] = (registerGuest as ReturnType<typeof mock>)
      .mock.calls[0]!;
    expect(tgId).toBe(555);
    expect(name).toBe('Анна');
    expect(actorId).toBe(BOT_ACTOR_UUID);
    expect(addRoleToUser).toHaveBeenCalledWith(
      NEW_USER_UUID,
      'SUBSCRIBER',
      NEW_USER_UUID,
    );
  });

  test('известный пользователь вошёл в группу → регистрация не вызывается, SUBSCRIBER добавлен', async () => {
    const { bot, handlers } = makeBot();
    const registerGuest = mock(async () => {
      throw new Error(
        'registerGuest не должен вызываться для известного пользователя',
      );
    });
    const addRoleToUser = mock(async () => {});
    const userFacade = {
      getUserByTelegramId: mock(async (tgId: number) =>
        tgId === STUDENT_TG
          ? {
              uuid: STUDENT_UUID,
              name: 'Иван Студент',
              telegramId: STUDENT_TG,
              roles: ['STUDENT'],
              createdAt: '',
            }
          : undefined,
      ),
      registerGuest,
      addRoleToUser,
      removeRoleFromUser: mock(async () => {}),
    } as unknown as UserFacade;

    registerGroupHandlers(bot, userFacade, logger, {
      apiApp: {
        execute: mock(async () => []),
      } as unknown as GroupHandlerDeps['apiApp'],
      transport: {
        notify: mock(async () => {}),
      } as unknown as GroupHandlerDeps['transport'],
      actorId: BOT_ACTOR_UUID,
    });

    await handlers.chat_member?.(makeChatMemberContext('member', 'left'));

    expect(addRoleToUser).toHaveBeenCalledWith(
      STUDENT_UUID,
      'SUBSCRIBER',
      STUDENT_UUID,
    );
  });

  test('незнакомый добавил бота в группу → регистрируется как гость и получает SUBSCRIBER', async () => {
    const { bot, handlers } = makeBot();
    const registerGuest = mock(async (tgId: number, name: string) => ({
      uuid: NEW_USER_UUID,
      name,
      telegramId: tgId,
      roles: ['GUEST'],
      createdAt: '',
    }));
    const addRoleToUser = mock(async () => {});
    const userFacade = {
      getUserByTelegramId: mock(async () => undefined),
      registerGuest,
      addRoleToUser,
      removeRoleFromUser: mock(async () => {}),
    } as unknown as UserFacade;

    registerGroupHandlers(bot, userFacade, logger, {
      apiApp: {
        execute: mock(async () => []),
      } as unknown as GroupHandlerDeps['apiApp'],
      transport: {
        notify: mock(async () => {}),
      } as unknown as GroupHandlerDeps['transport'],
      actorId: BOT_ACTOR_UUID,
    });

    await handlers.my_chat_member?.({
      myChatMember: {
        from: { id: 888, first_name: 'Пётр' },
        old_chat_member: { status: 'left' },
        new_chat_member: { status: 'administrator' },
      },
    });

    expect(registerGuest).toHaveBeenCalledWith(888, 'Пётр', BOT_ACTOR_UUID);
    expect(addRoleToUser).toHaveBeenCalledWith(NEW_USER_UUID, 'SUBSCRIBER');
  });
});
