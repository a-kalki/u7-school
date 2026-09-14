import { describe, expect, mock, test } from 'bun:test';
import { Role } from '#domain/user/roles';
import { UserInProcFacade } from './user-in-proc-facade';

const userId = '550e8400-e29b-41d4-a716-446655440000';

/** Мок UserApiModule с записью вызовов execute. */
function makeMockModule() {
  return {
    execute: mock(async (_name: string, _attrs?: unknown) => undefined),
  };
}

describe('UserInProcFacade.notify', () => {
  test('делегирует в UC notify-user с payload {userId, text}', async () => {
    const mod = makeMockModule();
    const facade = new UserInProcFacade(mod as never);

    await facade.notify(userId, 'Привет!');

    expect(mod.execute).toHaveBeenCalledWith(
      'notify-user',
      { userId, text: 'Привет!', kind: undefined },
      undefined,
    );
  });

  test('передаёт kind и actor, если они указаны', async () => {
    const mod = makeMockModule();
    const facade = new UserInProcFacade(mod as never);
    const actor = {
      uuid: '11111111-1111-4111-8111-111111111111',
      name: 'Иван',
      telegramId: 1,
      roles: [Role.ADMIN],
      createdAt: '2026-05-01T12:00',
    };

    await facade.notify(userId, 'Текст', 'warn', actor);

    expect(mod.execute).toHaveBeenCalledWith(
      'notify-user',
      { userId, text: 'Текст', kind: 'warn' },
      actor,
    );
  });

  test('ошибка шины не глушится (прозрачность для вызывающего)', async () => {
    const mod = {
      execute: mock(async () => {
        throw new Error('шина недоступна');
      }),
    };
    const facade = new UserInProcFacade(mod as never);

    await expect(facade.notify(userId, 'Текст')).rejects.toThrow(
      'шина недоступна',
    );
  });
});
