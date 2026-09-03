import { describe, expect, mock, test } from 'bun:test';
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
      { userId, text: 'Привет!' },
      undefined,
    );
  });

  test('передаёт actorId, если он указан', async () => {
    const mod = makeMockModule();
    const facade = new UserInProcFacade(mod as never);
    const actorId = '11111111-1111-4111-8111-111111111111';

    await facade.notify(userId, 'Текст', actorId);

    expect(mod.execute).toHaveBeenCalledWith(
      'notify-user',
      { userId, text: 'Текст' },
      actorId,
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
