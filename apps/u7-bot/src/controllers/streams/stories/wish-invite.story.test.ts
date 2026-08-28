import { describe, expect, mock, test } from 'bun:test';
import type { WishInviteEvent } from '@u7-scl/wish/domain';
import { WishInviteStory } from './wish-invite.story';

const streamId = '11111111-1111-4111-8111-111111111111';
const userId = '22222222-2222-4222-8222-222222222222';
const courseId = '44444444-4444-4444-8444-444444444444';
const moduleId = '33333333-3333-4333-8333-333333333333';
const mentorId = '55555555-5555-4555-8555-555555555555';
const telegramId = 777;

function makeEvent(
  overrides: Partial<WishInviteEvent['payload']> = {},
): WishInviteEvent {
  return {
    eventId: crypto.randomUUID(),
    eventName: 'wish:invite',
    occurredAt: '2026-08-27T12:00',
    aggregateName: 'Wish',
    aggregateId: crypto.randomUUID(),
    payload: {
      wishId: crypto.randomUUID(),
      streamId,
      userId,
      telegramId,
      wishKind: 'course',
      courseId,
      ...overrides,
    },
  };
}

function makeStory(options: Record<string, unknown> = {}) {
  const sent: unknown[] = [];

  const mockAppApi = {
    execute: mock(async (name: string, _attrs: Record<string, unknown>) => {
      if (name === 'get-stream') {
        return (
          options.stream ?? {
            uuid: streamId,
            title: 'Поток «JavaScript с нуля» (модуль_1)',
            startDate: '2026-09-01T10:00',
            mentorId,
          }
        );
      }
      if (name === 'get-user') {
        return (
          options.mentor ?? {
            uuid: mentorId,
            name: 'Ментор Менторович',
            nick: options.nick,
            telegramId: 1,
          }
        );
      }
      return undefined;
    }),
  };

  const mockUiApp = {
    getAction: mock(() => () => ({
      text: '↩️ Главное меню',
      code: 'app:main-menu',
    })),
    getController: mock(() => undefined),
  } as never;

  const story = new WishInviteStory();
  story.init(
    { appApi: mockAppApi, uiApp: mockUiApp } as never,
    {
      send: mock(async (_tg: number, command: unknown) => {
        sent.push(command);
      }),
      notify: mock(async () => {}),
    } as never,
  );

  return { story, mockAppApi, sent };
}

describe('WishInviteStory', () => {
  test('подписан на wish:invite', () => {
    const { story } = makeStory();
    const subs = story.getEventSubscriptions();
    expect(subs.map((s) => s.eventName)).toEqual(['wish:invite']);
  });

  test('course-приглашение: адаптивный текст, кнопки, доставка через send', async () => {
    const { story, sent } = makeStory();

    await story.getEventSubscriptions()[0]!.handle(makeEvent());

    expect(sent).toHaveLength(1);
    const command = sent[0] as {
      sendMessage?: {
        text: string;
        keyboard?: { rows: Array<Array<{ text: string; code: string }>> };
      };
    };
    const text = command.sendMessage?.text ?? '';
    expect(text).toContain('Открылся набор на курс, который ты хотел пройти');
    expect(text).toContain('Поток: Поток «JavaScript с нуля»');
    expect(text).toContain('ключ зачисления');

    const rows = command.sendMessage?.keyboard?.rows ?? [];
    const flat = rows.flat();
    const open = flat.find((b) => b.text.includes('Открыть поток'));
    expect(open?.code).toBe(`stream:view-stream:view:${streamId}`);
    const cancel = flat.find((b) => b.text.includes('Отменить желание'));
    expect(cancel?.code).toBe(`course:course-catalog:cancel:${courseId}`);
  });

  test('module-приглашение: адаптивный текст и маршрут отмены модуля', async () => {
    const { story, sent } = makeStory();

    await story
      .getEventSubscriptions()[0]!
      .handle(makeEvent({ wishKind: 'module', moduleId, courseId: undefined }));

    const command = sent[0] as {
      sendMessage?: {
        text: string;
        keyboard?: { rows: Array<Array<{ text: string; code: string }>> };
      };
    };
    const text = command.sendMessage?.text ?? '';
    expect(text).toContain('Открылся набор на модуль, который ты хотел пройти');

    const flat = (command.sendMessage?.keyboard?.rows ?? []).flat();
    const cancel = flat.find((b) => b.text.includes('Отменить желание'));
    expect(cancel?.code).toBe(`course:course-catalog:cancel-mod:${moduleId}`);
  });

  test('ментор с nick: кликабельная t.me-ссылка', async () => {
    const { story, sent } = makeStory({ nick: 'mentor_nick' });

    await story.getEventSubscriptions()[0]!.handle(makeEvent());

    const command = sent[0] as { sendMessage?: { text: string } };
    const text = command.sendMessage?.text ?? '';
    expect(text).toContain('Ментор Менторович');
    expect(text).toContain('[@mentor\\_nick](https://t.me/mentor_nick)');
  });

  test('ментор без nick: просто имя, без ссылки', async () => {
    const { story, sent } = makeStory({ nick: undefined });

    await story.getEventSubscriptions()[0]!.handle(makeEvent());

    const command = sent[0] as { sendMessage?: { text: string } };
    const text = command.sendMessage?.text ?? '';
    expect(text).toContain('Ментор Менторович');
    expect(text).not.toContain('t.me');
  });

  test('поток недоступен — тихий пропуск без отправки и без ошибки', async () => {
    const { story, sent, mockAppApi } = makeStory();
    (mockAppApi.execute as ReturnType<typeof mock>).mockImplementationOnce(
      async () => {
        throw new Error('STREAM_NOT_FOUND');
      },
    );

    await story.getEventSubscriptions()[0]!.handle(makeEvent());

    expect(sent).toHaveLength(0);
  });
});
