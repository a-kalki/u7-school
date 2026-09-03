import { describe, expect, mock, test } from 'bun:test';
import type { EventBus } from '@u7-scl/core/domain';
import type { UserApiModuleResolver } from '#domain/module';
import type { UserNotifiedEvent } from '#domain/user/events';
import { NotifyUserUc } from './notify-user-uc';

const userId = '550e8400-e29b-41d4-a716-446655440000';

describe('NotifyUserUc', () => {
  function setup() {
    const publish = mock((_event: UserNotifiedEvent) => {});
    const eventBus = { publish } as unknown as EventBus;
    const uc = new NotifyUserUc();
    uc.init({
      userRepo: {},
      appResolver: {},
      eventBus,
    } as unknown as UserApiModuleResolver);
    return { publish, uc };
  }

  test('публикует user.notified с payload {userId, text}', async () => {
    const { publish, uc } = setup();

    await uc.execute({ userId, text: 'Привет!' });

    expect(publish).toHaveBeenCalledTimes(1);
    const event = (publish as ReturnType<typeof mock>).mock
      .calls[0]![0] as UserNotifiedEvent;
    expect(event.eventName).toBe('user.notified');
    expect(event.aggregateName).toBe('User');
    expect(event.aggregateId).toBe(userId);
    expect(event.payload).toEqual({ userId, text: 'Привет!' });
    expect(event.eventId).toBeDefined();
    expect(event.occurredAt).toBeDefined();
  });

  test('ничего не мутирует: репозиторий не вызывается, output — undefined', async () => {
    const getByUuid = mock(() => Promise.resolve(undefined));
    const save = mock(() => Promise.resolve());
    const publish = mock((_event: UserNotifiedEvent) => {});
    const uc = new NotifyUserUc();
    uc.init({
      userRepo: { getByUuid, save },
      appResolver: {},
      eventBus: { publish },
    } as unknown as UserApiModuleResolver);

    const result = await uc.execute({ userId, text: 'Текст' });

    expect(result).toBeUndefined();
    expect(getByUuid).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
  });

  test('handle: пустой текст → INPUT_VALIDATION_ERROR', async () => {
    const { publish, uc } = setup();

    await expect(uc.handle({ userId, text: '   ' })).rejects.toThrow(
      'Переданы некорректные данные',
    );
    expect(publish).not.toHaveBeenCalled();
  });

  test('handle: некорректный userId → INPUT_VALIDATION_ERROR', async () => {
    const { publish, uc } = setup();

    await expect(
      uc.handle({ userId: 'не-uuid', text: 'Текст' }),
    ).rejects.toThrow('Переданы некорректные данные');
    expect(publish).not.toHaveBeenCalled();
  });
});
