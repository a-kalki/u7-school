import { describe, expect, mock, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import type { U7BotApp } from '@u7-scl/bot/u7-bot-app-meta';
import { assertMarkdownV2Safe } from '@u7-scl/core/shared';
import type { BotSession } from '@u7-scl/core/ui';
import { InviteStory } from './invite.story';

/**
 * Поведенческие тесты InviteStory на контракте «Диалог и Экран»:
 * старт заполнения через delegate в fill-стори (ввод анкеты адресуется
 * fill-диалогу), MarkdownV2-безопасность доменных текстов (инцидент
 * 2026-09-03), fallback-реплики.
 */
//
// ══ Помощники ══

const actor = { uuid: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee' } as User;

const session: BotSession = {
  dialog: { path: 'questionnaire/invite', seq: 3 },
};

function makeStory(
  execute: (name: string, cmd: unknown, actorId: string) => Promise<unknown> = async () => ({}),
) {
  const appApi = { execute: mock(execute) } as unknown as U7BotApp;
  const story = new InviteStory();
  const sender = {
    notify: mock(async () => {}),
    invite: mock(async () => {}),
    kickFromGroup: mock(async () => {}),
  };
  story.init({ appApi } as never, sender);
  return { story, appApi, sender };
}

/** Доменный текст со спецсимволами MarkdownV2 (инцидент 2026-09-03). */
const unsafeText = 'Иванов_Иван (senior). Backend / Node.js!';

// ══ Старт заполнения — delegate в fill ══

describe('InviteStory — invite:start: делегирование fill-стори', () => {
  test('start:q → start-by-invite + delegate fill:current:{qId} — ввод адресуется fill-диалогу', async () => {
    const { story, appApi } = makeStory(async (name) => {
      if (name === 'start-by-invite') {
        return {
          type: 'new_question',
          questionnaireId: 'q-1',
          question: { questionCode: 'qc1', type: 'text', question: 'О себе' },
        };
      }
      throw new Error(`Неожиданный UC: ${name}`);
    });

    const res = await story.handleCallback('start:q-1', actor, session);

    expect(appApi.execute).toHaveBeenCalledWith(
      'start-by-invite',
      { questionnaireId: 'q-1' },
      actor.uuid,
    );

    // Делегат строится cbFor: контроллер префиксует до dispatch
    expect(res.delegate?.path).toBe('fill:current:q-1');
  });

  test('start:q при недоступной анкете: экран ошибки с выходом в меню', async () => {
    const { story } = makeStory(async () => {
      throw new (await import('@u7-scl/core/domain')).AppException(
        (await import('@u7-scl/core/domain')).errBadRequest(
          'BAD_REQUEST',
          'Анкета уже завершена',
        ),
      );
    });

    const res = await story.handleCallback('start:q-1', actor, session);

    expect(String(res.screen?.text)).toContain('Анкета уже завершена');
    const flat = res.screen?.keyboard?.rows.flat() ?? [];
    expect(flat.map((b) => [b.text, b.code])).toEqual([
      ['⬅️ Меню', 'app:main-menu'],
    ]);
  });
});

// ══ MarkdownV2-безопасность доменных текстов ══

describe('InviteStory — MarkdownV2-безопасность (инцидент 2026-09-03)', () => {
  test('подписка questionnaire:invite: текст с спецсимволами безопасен', async () => {
    const { story, sender } = makeStory();

    const sub = story
      .getEventSubscriptions()
      .find((s) => s.eventName === 'questionnaire:invite')!;

    await sub.handle({
      eventName: 'questionnaire:invite',
      payload: {
        telegramId: 456,
        response: {
          type: 'invited',
          questionnaireId: 'q1',
          inviteText: unsafeText,
        },
      },
    } as never);

    const [telegramId, payload] = sender.invite.mock.calls[0] as [
      number,
      { text: string },
    ];
    expect(telegramId).toBe(456);
    expect(payload.text).toContain('Иванов_Иван');
    expect(() => assertMarkdownV2Safe(payload.text)).not.toThrow();
  });

  test('invite:why: whyText с спецсимволами безопасен', async () => {
    const { story } = makeStory(async () => ({
      type: 'invited',
      questionnaireId: 'q1',
      whyText: unsafeText,
    }));

    const res = await story.handleCallback('why:q1', actor, session);

    expect(res.screen?.text).toContain('Иванов_Иван');
    expect(() => assertMarkdownV2Safe(res.screen!.text)).not.toThrow();
  });

  test('invite:invite: повторный S01 с небезопасным inviteText', async () => {
    const { story } = makeStory(async () => ({
      type: 'invited',
      questionnaireId: 'q1',
      inviteText: unsafeText,
    }));

    const res = await story.handleCallback('invite:q1', actor, session);

    expect(() => assertMarkdownV2Safe(res.screen!.text)).not.toThrow();
  });

  test('cancelWarning в confirm-экране пропуска (decline) безопасен', async () => {
    const { story } = makeStory(async () => ({
      type: 'invited',
      questionnaireId: 'q1',
      cancelWarning: unsafeText,
    }));

    const res = await story.handleCallback('decline:q1', actor, session);

    expect(String(res.screen?.text)).toContain('Иванов_Иван');
    expect(() => assertMarkdownV2Safe(res.screen!.text)).not.toThrow();
  });
});

// ══ Fallback-реплики ══

describe('InviteStory — fallback-реплики при пустых текстах пула', () => {
  test('подписка: без inviteText — «Заполните, пожалуйста, анкету.»', async () => {
    const { story, sender } = makeStory();

    const sub = story
      .getEventSubscriptions()
      .find((s) => s.eventName === 'questionnaire:invite')!;

    await sub.handle({
      eventName: 'questionnaire:invite',
      payload: {
        telegramId: 456,
        response: { type: 'invited', questionnaireId: 'q1' },
      },
    } as never);

    const [, payload] = sender.invite.mock.calls[0] as [
      number,
      { text: string },
    ];
    expect(payload.text).toContain('Заполните, пожалуйста, анкету');
  });

  test('invite:why: без whyText — «Нет дополнительной информации.»', async () => {
    const { story } = makeStory(async () => ({
      type: 'invited',
      questionnaireId: 'q1',
    }));

    const res = await story.handleCallback('why:q1', actor, session);

    expect(String(res.screen?.text)).toContain('Нет дополнительной информации');
  });
});
