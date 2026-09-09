import { describe, expect, mock, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import type { NotificationPayload } from '@u7-scl/core/ui';
import type { UserNotifiedEvent } from '@u7-scl/user/domain';
import { NotifyStory } from './notify.story';

const USER_ID = '550e8400-e29b-41d4-a716-446655440000';

function makeEvent(
  overrides: Partial<UserNotifiedEvent['payload']> = {},
): UserNotifiedEvent {
  return {
    eventId: crypto.randomUUID(),
    eventName: 'user.notified',
    occurredAt: '2026-09-02T12:00:00.000Z',
    aggregateName: 'User',
    aggregateId: USER_ID,
    payload: { userId: USER_ID, text: 'Уведомление о событии.', ...overrides },
  };
}

interface SetupOptions {
  /** Пользователь не найден (get-user → undefined). */
  userMissing?: boolean;
  /** Переопределения полей пользователя. */
  userOverrides?: Partial<User>;
  /** get-user бросает ошибку. */
  userFails?: boolean;
}

function setupStory(opts: SetupOptions = {}) {
  const execute = mock(
    async (name: string, params?: Record<string, unknown>) => {
      if (name === 'get-user') {
        if (opts.userFails) throw new Error('профиль недоступен');
        if (opts.userMissing) return undefined;
        return {
          uuid: params?.uuid,
          name: 'Студент',
          telegramId: 1003,
          roles: [],
          createdAt: '2026-01-01T00:00',
          ...opts.userOverrides,
        };
      }
      return undefined;
    },
  );

  const notify = mock(
    async (_tgId: number, _payload: NotificationPayload) => {},
  );

  const story = new NotifyStory();
  story.init(
    { appApi: { execute }, uiApp: {} } as never,
    {
      notify,
      invite: mock(async () => {}),
      kickFromGroup: mock(async () => {}),
    } as never,
  );
  return { story, notify, execute };
}

function subHandler(story: NotifyStory) {
  const sub = story
    .getEventSubscriptions()
    .find((s) => s.eventName === 'user.notified');
  if (!sub) throw new Error('подписка на user.notified не найдена');
  return sub.handle;
}

describe('NotifyStory', () => {
  test('подписывается только на user.notified', () => {
    const { story } = setupStory();
    const subs = story.getEventSubscriptions();
    expect(subs).toHaveLength(1);
    expect(subs[0]!.eventName).toBe('user.notified');
  });

  test('доставляет адресату проактив вида notify (🔔, единая таблица ФР-5)', async () => {
    const { story, notify } = setupStory();

    await subHandler(story)(makeEvent({ text: 'Привет, мир!' }));

    expect(notify).toHaveBeenCalledTimes(1);
    const [tgId, payload] = (notify as ReturnType<typeof mock>).mock
      .calls[0] as [number, NotificationPayload];
    expect(tgId).toBe(1003);
    expect(payload.kind).toBe('notify');
    // спецсимвол «!» экранирован md-интерполяцией
    expect(payload.text).toContain('Привет, мир\\!');
  });

  test('экранирует спецсимволы MarkdownV2 в доменном тексте', async () => {
    const { story, notify } = setupStory();

    await subHandler(story)(
      makeEvent({ text: 'Поток «JS Core — Поток 2» (старт!)' }),
    );

    const [, payload] = (notify as ReturnType<typeof mock>).mock.calls[0] as [
      number,
      NotificationPayload,
    ];
    // ( ) ! — спецсимволы MarkdownV2, должны быть экранированы
    expect(payload.text).toContain('\\(');
    expect(payload.text).toContain('\\)');
    expect(payload.text).toContain('\\!');
    // «» и — не экранируются (валидные в MarkdownV2)
    expect(payload.text).toContain('«JS Core — Поток 2»');
  });

  test('пользователь не найден → лог-ошибка, доставка пропущена, без исключения', async () => {
    const { story, notify } = setupStory({ userMissing: true });

    await expect(subHandler(story)(makeEvent())).resolves.toBeUndefined();
    expect(notify).not.toHaveBeenCalled();
  });

  test('пользователь без telegramId → доставка пропущена, без исключения', async () => {
    const { story, notify } = setupStory({
      userOverrides: { telegramId: undefined },
    });

    await expect(subHandler(story)(makeEvent())).resolves.toBeUndefined();
    expect(notify).not.toHaveBeenCalled();
  });

  test('сбой get-user не всплывает наружу (приложение не падает)', async () => {
    const { story, notify } = setupStory({ userFails: true });

    await expect(subHandler(story)(makeEvent())).resolves.toBeUndefined();
    expect(notify).not.toHaveBeenCalled();
  });

  test('story не интерактивна: callback — заглушка «Неизвестная команда»', async () => {
    const { story } = setupStory();
    const actor: User = {
      uuid: USER_ID,
      name: 'С',
      telegramId: 1,
      roles: [],
      createdAt: '2026-01-01T00:00',
    };
    const cb = await story.handleCallback('any', actor, {
      dialog: { path: 'user/notify', seq: 1 },
    });
    expect(String(cb.screen?.text)).toContain('Неизвестная');
  });

  test('handleMessage — дефолт ядра: реплика-отказ без захвата экрана', async () => {
    const { story } = setupStory();
    const actor: User = {
      uuid: USER_ID,
      name: 'С',
      telegramId: 1,
      roles: [],
      createdAt: '2026-01-01T00:00',
    };
    const msg = await story.handleMessage(
      { type: 'message', text: 'x', telegramId: 1 },
      actor,
      { dialog: { path: 'user/notify', seq: 1 } },
    );
    expect(String(msg.notify?.text)).toContain('не принимаются');
    expect(msg.release).toBe(true);
  });
});
