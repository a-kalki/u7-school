import { describe, expect, mock, test } from 'bun:test';
import type { Logger } from '@u7-scl/core/shared';
import type { UserFacade } from '@u7-scl/user/domain';
import { type GroupHandlerDeps, registerGroupHandlers } from './group-handler';

// ══ Моки ══

const SCHOOL_GROUP_ID = -1002222222222; // школьная группа (deps.schoolGroupId)
const STREAM_GROUP_ID = -1003333333333; // группа потока (≠ школьной)
const FOREIGN_GROUP_ID = -1009999999999; // посторонняя группа
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
  chatId: number | string = SCHOOL_GROUP_ID,
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

function makeMyChatMemberContext(
  chatId: number,
  status: 'member' | 'administrator' = 'administrator',
  from: { id: number; first_name: string } = { id: 888, first_name: 'Пётр' },
) {
  return {
    myChatMember: {
      chat: { id: chatId },
      from,
      old_chat_member: { status: 'left' },
      new_chat_member: { status },
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
  test('студент покинул группу потока → ментору уведомление, SUBSCRIBER не тронут (не школьная группа)', async () => {
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
            telegramGroupId: String(STREAM_GROUP_ID),
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
      schoolGroupId: SCHOOL_GROUP_ID,
    });

    await handlers.chat_member?.(
      makeChatMemberContext('left', 'member', STREAM_GROUP_ID),
    );

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

    // Выход из группы потока (не школьной) роль не меняет
    expect(
      (userFacade.removeRoleFromUser as ReturnType<typeof mock>).mock.calls,
    ).toEqual([]);
  });

  test('студент покинул школьную группу → SUBSCRIBER снят от имени бота, ментору ничего (поток не матчится)', async () => {
    const { bot, handlers } = makeBot();
    const userFacade = makeUserFacade();
    const notify = mock(async () => {});
    const execute = mock(async (name: string) => {
      if (name === 'list-streams') {
        // Поток привязан к другой группе — уведомление не должно уйти
        return [
          {
            uuid: STREAM_ID,
            mentorId: MENTOR_UUID,
            telegramGroupId: String(STREAM_GROUP_ID),
          },
        ];
      }
      return undefined;
    });

    registerGroupHandlers(bot, userFacade, logger, {
      apiApp: { execute } as unknown as GroupHandlerDeps['apiApp'],
      transport: { notify } as unknown as GroupHandlerDeps['transport'],
      actorId: BOT_ACTOR_UUID,
      schoolGroupId: SCHOOL_GROUP_ID,
    });

    await handlers.chat_member?.(
      makeChatMemberContext('left', 'member', SCHOOL_GROUP_ID),
    );

    expect(notify).not.toHaveBeenCalled();
    expect(
      (userFacade.removeRoleFromUser as ReturnType<typeof mock>).mock.calls,
    ).toEqual([[STUDENT_UUID, 'SUBSCRIBER', BOT_ACTOR_UUID]]);
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
              telegramGroupId: String(STREAM_GROUP_ID),
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
      schoolGroupId: SCHOOL_GROUP_ID,
    });

    await handlers.chat_member?.(
      makeChatMemberContext('left', 'member', STREAM_GROUP_ID),
    );

    expect(notify).not.toHaveBeenCalled();
  });

  test('выход из чужой группы (ни школьная, ни поток) — ни уведомления, ни роли', async () => {
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
              telegramGroupId: String(STREAM_GROUP_ID),
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
      schoolGroupId: SCHOOL_GROUP_ID,
    });

    await handlers.chat_member?.(
      makeChatMemberContext('left', 'member', FOREIGN_GROUP_ID),
    );

    expect(notify).not.toHaveBeenCalled();
    expect(
      (userFacade.removeRoleFromUser as ReturnType<typeof mock>).mock.calls,
    ).toEqual([]);
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
              telegramGroupId: String(STREAM_GROUP_ID),
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
      schoolGroupId: SCHOOL_GROUP_ID,
    });

    await handlers.chat_member?.(
      makeChatMemberContext('left', 'member', STREAM_GROUP_ID),
    );

    expect(notify).not.toHaveBeenCalled();
  });
});

// ══ Тесты регистрации гостей ══

describe('registerGroupHandlers — регистрация гостей', () => {
  test('незнакомый вошёл в школьную группу → гость от имени бота + SUBSCRIBER от имени бота', async () => {
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
      schoolGroupId: SCHOOL_GROUP_ID,
    });

    await handlers.chat_member?.(
      makeChatMemberContext('member', 'left', SCHOOL_GROUP_ID, {
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
      BOT_ACTOR_UUID,
    );
  });

  test('незнакомый вошёл в чужую группу → игнор: ни регистрации, ни роли', async () => {
    const { bot, handlers } = makeBot();
    const registerGuest = mock(async () => {
      throw new Error('registerGuest не должен вызываться для чужой группы');
    });
    const addRoleToUser = mock(async () => {
      throw new Error('addRoleToUser не должен вызываться для чужой группы');
    });
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
      schoolGroupId: SCHOOL_GROUP_ID,
    });

    await handlers.chat_member?.(
      makeChatMemberContext('member', 'left', FOREIGN_GROUP_ID, {
        id: 555,
        first_name: 'Анна',
      }),
    );

    expect(registerGuest).not.toHaveBeenCalled();
    expect(addRoleToUser).not.toHaveBeenCalled();
  });

  test('известный пользователь вошёл в школьную группу → регистрация не вызывается, SUBSCRIBER от имени бота', async () => {
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
      schoolGroupId: SCHOOL_GROUP_ID,
    });

    await handlers.chat_member?.(
      makeChatMemberContext('member', 'left', SCHOOL_GROUP_ID),
    );

    expect(addRoleToUser).toHaveBeenCalledWith(
      STUDENT_UUID,
      'SUBSCRIBER',
      BOT_ACTOR_UUID,
    );
  });

  test('незнакомый добавил бота в школьную группу → гость + SUBSCRIBER от имени бота', async () => {
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
      schoolGroupId: SCHOOL_GROUP_ID,
    });

    await handlers.my_chat_member?.(
      makeMyChatMemberContext(SCHOOL_GROUP_ID, 'administrator'),
    );

    expect(registerGuest).toHaveBeenCalledWith(888, 'Пётр', BOT_ACTOR_UUID);
    expect(addRoleToUser).toHaveBeenCalledWith(
      NEW_USER_UUID,
      'SUBSCRIBER',
      BOT_ACTOR_UUID,
    );
  });

  test('незнакомый добавил бота в чужую группу → игнор: ни регистрации, ни роли', async () => {
    const { bot, handlers } = makeBot();
    const registerGuest = mock(async () => {
      throw new Error('registerGuest не должен вызываться для чужой группы');
    });
    const addRoleToUser = mock(async () => {
      throw new Error('addRoleToUser не должен вызываться для чужой группы');
    });
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
      schoolGroupId: SCHOOL_GROUP_ID,
    });

    await handlers.my_chat_member?.(
      makeMyChatMemberContext(FOREIGN_GROUP_ID, 'member'),
    );

    expect(registerGuest).not.toHaveBeenCalled();
    expect(addRoleToUser).not.toHaveBeenCalled();
  });
});
