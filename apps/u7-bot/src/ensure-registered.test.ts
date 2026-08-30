import { describe, expect, mock, test } from 'bun:test';
import type { UserFacade } from '@u7-scl/user/domain';
import { ensureRegisteredGuest } from './ensure-registered';

const BOT_ACTOR_UUID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

function makeFacade(existing?: unknown) {
  return {
    getUserByTelegramId: mock(async () => existing),
    registerGuest: mock(async () => ({
      uuid: '77777777-7777-4777-8777-777777777777',
    })),
  } as unknown as UserFacade;
}

describe('ensureRegisteredGuest', () => {
  test('новый пользователь → registerGuest от имени бота (first_name + username)', async () => {
    const facade = makeFacade(undefined);

    await ensureRegisteredGuest(facade, BOT_ACTOR_UUID, {
      id: 555,
      first_name: 'Анна',
      username: 'anna_u7',
    });

    const registerMock = (
      facade as unknown as { registerGuest: ReturnType<typeof mock> }
    ).registerGuest;
    expect(registerMock).toHaveBeenCalledTimes(1);
    const [tgId, name, actorId, nick] = registerMock.mock.calls[0]!;
    expect(tgId).toBe(555);
    expect(name).toBe('Анна');
    expect(actorId).toBe(BOT_ACTOR_UUID);
    expect(nick).toBe('anna_u7');
  });

  test('существующий пользователь → регистрация не вызывается', async () => {
    const facade = makeFacade({
      uuid: '77777777-7777-4777-8777-777777777777',
      name: 'Анна',
    });

    await ensureRegisteredGuest(facade, BOT_ACTOR_UUID, {
      id: 555,
      first_name: 'Анна',
    });

    const registerMock = (
      facade as unknown as { registerGuest: ReturnType<typeof mock> }
    ).registerGuest;
    expect(registerMock).not.toHaveBeenCalled();
  });

  test('без username → nick не передаётся', async () => {
    const facade = makeFacade(undefined);

    await ensureRegisteredGuest(facade, BOT_ACTOR_UUID, {
      id: 556,
      first_name: 'Пётр',
    });

    const registerMock = (
      facade as unknown as { registerGuest: ReturnType<typeof mock> }
    ).registerGuest;
    const [, , , nick] = registerMock.mock.calls[0]!;
    expect(nick).toBeUndefined();
  });
});
