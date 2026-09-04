import { describe, expect, mock, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import type { U7BotApp } from '@u7-scl/bot/u7-bot-app-meta';
import { assertMarkdownV2Safe } from '@u7-scl/core/shared';
import { InviteStory } from './invite.story';
import { renderActionResponse } from './render';

/**
 * Создаёт InviteStory с моком API приложения.
 *
 * Обработчики событий рендерят и шлют через proactiveSender; API-вызовы
 * (старт, отказ) имитируются моком execute — поведение задаётся тестом.
 */
function makeStory(
  execute: (
    name: string,
    cmd: unknown,
    actorId: string,
  ) => Promise<unknown> = async () => ({}),
) {
  const appApi = { execute: mock(execute) } as unknown as U7BotApp;
  const story = new InviteStory();
  const sender = {
    send: mock(async () => {}),
    notify: mock(async () => {}),
    kickFromGroup: mock(async () => {}),
  };
  story.init({ appApi } as never, sender);
  return { story, appApi, sender };
}

/** Извлекает последний вызов proactiveSender.send. */
function getSentCommand(sender: { send: ReturnType<typeof mock> }): {
  telegramId: number;
  command: import('@u7-scl/core/ui').BotCommand;
} {
  expect(sender.send).toHaveBeenCalled();
  const [telegramId, command] = sender.send.mock.calls[0] as [
    number,
    import('@u7-scl/core/ui').BotCommand,
  ];
  return { telegramId, command };
}

describe('InviteStory — подписки на доменные события', () => {
  test('getEventSubscriptions возвращает 1 подписку — questionnaire:invite', () => {
    const { story } = makeStory();

    const subs = story.getEventSubscriptions();

    expect(subs.map((s) => s.eventName)).toEqual(['questionnaire:invite']);
  });
});

describe('InviteStory — S01 по событию questionnaire:invite', () => {
  test('рендерит S01 и шлёт через proactiveSender', async () => {
    const { story, sender } = makeStory();

    const inviteSub = story
      .getEventSubscriptions()
      .find((s) => s.eventName === 'questionnaire:invite');
    expect(inviteSub).toBeDefined();

    await inviteSub!.handle({
      eventName: 'questionnaire:invite',
      payload: {
        telegramId: 456,
        response: {
          type: 'invited',
          questionnaireId: 'q1',
          inviteText: 'Заполните анкету',
          whyText: 'Для обучения',
        },
      },
    } as never);

    const { telegramId, command } = getSentCommand(sender);
    expect(telegramId).toBe(456);
    expect(command.sendMessage?.text).toContain('Анкета');

    const codes =
      command.sendMessage?.keyboard?.rows.flat().map((b) => b.code) ?? [];
    expect(codes).toEqual([
      'invite:start:q1',
      'invite:why:q1',
      'invite:decline:q1',
    ]);
  });

  test('без whyText кнопка «Зачем это нужно?» не показывается', async () => {
    const { story, sender } = makeStory();

    const inviteSub = story
      .getEventSubscriptions()
      .find((s) => s.eventName === 'questionnaire:invite')!;

    await inviteSub.handle({
      eventName: 'questionnaire:invite',
      payload: {
        telegramId: 456,
        response: { type: 'invited', questionnaireId: 'q1' },
      },
    } as never);

    const { command } = getSentCommand(sender);
    const texts =
      command.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(texts).toEqual(['▶️ Начать заполнение', '⏭️ Пропустить']);
  });
});

describe('InviteStory — invite:start (передача управления fill-стори)', () => {
  test('вызывает start-by-invite, рендерит вопрос и захватывает ввод fill', async () => {
    const { story, appApi } = makeStory(async (name) => {
      if (name === 'start-by-invite') {
        return {
          type: 'new_question',
          questionnaireId: 'q-1',
          question: {
            questionCode: 'qc1',
            type: 'text',
            question: 'Как тебя зовут?',
          },
        };
      }
      throw new Error(`Неожиданный UC: ${name}`);
    });

    const actor = { uuid: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee' } as User;
    const res = await story.handleCallback('start:q-1', actor, {} as never);

    expect(appApi.execute).toHaveBeenCalledWith(
      'start-by-invite',
      { questionnaireId: 'q-1' },
      'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
    );
    expect(res.sendMessage?.text).toContain('Как тебя зовут?');
    expect(res.captureInput?.path).toBe('fill');
    expect(res.captureInput?.context).toEqual({ questionnaireId: 'q-1' });
  });
});

// Инцидент 2026-09-03: inviteText вставлялся в MarkdownV2 без экранирования —
// точки/скобки в тексте приглашения роняли отправку.
describe('InviteStory — MarkdownV2-безопасность inviteText', () => {
  const inviteTextWithMines = 'Привет! Заполни анкету (5 мин). Спасибо.';

  test('#handleInviteEvent: inviteText с точками/скобками проходит assertMarkdownV2Safe', async () => {
    const { story, sender } = makeStory();

    const inviteSub = story
      .getEventSubscriptions()
      .find((s) => s.eventName === 'questionnaire:invite')!;

    await inviteSub.handle({
      eventName: 'questionnaire:invite',
      payload: {
        telegramId: 456,
        response: {
          type: 'invited',
          questionnaireId: 'q1',
          inviteText: inviteTextWithMines,
          whyText: 'Для обучения',
        },
      },
    } as never);

    const { command } = getSentCommand(sender);
    expect(command.sendMessage?.parseMode).toBe('MarkdownV2');
    expect(() =>
      assertMarkdownV2Safe(command.sendMessage!.text as string),
    ).not.toThrow();
  });

  test('#handleInvite (invite:invite): inviteText с точками/скобками проходит assertMarkdownV2Safe', async () => {
    const { story } = makeStory(async (name) => {
      if (name === 'get-current') {
        return {
          type: 'invited',
          questionnaireId: 'q1',
          inviteText: inviteTextWithMines,
          whyText: 'Для обучения',
        };
      }
      throw new Error(`Неожиданный UC: ${name}`);
    });

    const actor = { uuid: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee' } as User;
    const res = await story.handleCallback('invite:q1', actor, {} as never);

    expect(res.sendMessage?.parseMode).toBe('MarkdownV2');
    expect(() =>
      assertMarkdownV2Safe(res.sendMessage!.text as string),
    ).not.toThrow();
  });

  test('#handleInvite без inviteText: fallback-текст с точкой проходит assertMarkdownV2Safe', async () => {
    const { story } = makeStory(async (name) => {
      if (name === 'get-current') {
        return { type: 'invited', questionnaireId: 'q1' };
      }
      throw new Error(`Неожиданный UC: ${name}`);
    });

    const actor = { uuid: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee' } as User;
    const res = await story.handleCallback('invite:q1', actor, {} as never);

    expect(() =>
      assertMarkdownV2Safe(res.sendMessage!.text as string),
    ).not.toThrow();
  });

  test('renderActionResponse(invited): inviteText с точками/скобками и fallback проходят assertMarkdownV2Safe', () => {
    const withMines = renderActionResponse({
      type: 'invited',
      questionnaireId: 'q1',
      inviteText: inviteTextWithMines,
    });
    expect(() =>
      assertMarkdownV2Safe(withMines.sendMessage!.text as string),
    ).not.toThrow();

    const fallback = renderActionResponse({
      type: 'invited',
      questionnaireId: 'q1',
    });
    expect(() =>
      assertMarkdownV2Safe(fallback.sendMessage!.text as string),
    ).not.toThrow();
  });
});
