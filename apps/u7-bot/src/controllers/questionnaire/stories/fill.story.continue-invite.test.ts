import { describe, expect, mock, test } from 'bun:test';
import { assertMarkdownV2Safe } from '@u7-scl/core/shared';
import { FillStory } from './fill.story';

/**
 * Подписка questionnaire:continue-invite (S09, ступень 3ч планировщика)
 * на контракте «Диалог и Экран»: канал invite (ФР-6), кнопки-мосты с
 * ПОЛНЫМИ кодами, подсказка /start, прерывание — через confirm.
 */
//
// ══ Помощники ══

function makeStory() {
  const story = new FillStory();
  const sender = {
    name: 'questionnaire',
    notify: mock(async () => {}),
    invite: mock(async () => {}),
    kickFromGroup: mock(async () => {}),
  };
  story.init({ appApi: { execute: mock(async () => ({})) } } as never, sender);
  return { story, sender };
}

describe('FillStory — continue-invite (S09): invite-канал', () => {
  test('подписка зарегистрирована', () => {
    const { story } = makeStory();
    const names = story.getEventSubscriptions().map((s) => s.eventName);
    expect(names).toContain('questionnaire:continue-invite');
  });

  test('сообщение «продолжим?» с кнопками «Продолжить анкету» и «Прервать»', async () => {
    const { story, sender } = makeStory();

    const sub = story
      .getEventSubscriptions()
      .find((s) => s.eventName === 'questionnaire:continue-invite')!;

    await sub.handle({
      eventName: 'questionnaire:continue-invite',
      payload: {
        questionnaireId: 'q-1',
        respondentId: 'r-1',
        telegramId: 456,
      },
      ownerInfo: { courseId: 'course-1' },
    } as never);

    expect(sender.invite).toHaveBeenCalledTimes(1);
    const [telegramId, payload] = sender.invite.mock.calls[0] as unknown as [
      number,
      { text: string; keyboard: { rows: { text: string; code: string }[][] } },
    ];
    expect(telegramId).toBe(456);

    expect(payload.text).toContain('продолжим?');
    expect(payload.text).toContain('/start');
    expect(() => assertMarkdownV2Safe(payload.text)).not.toThrow();

    expect(payload.keyboard.rows.flat().map((b) => [b.text, b.code])).toEqual([
      ['▶️ Продолжить анкету', 'questionnaire:fill:resume:course-1'],
      ['⏭️ Прервать', 'questionnaire:fill:cancel:q-1'],
    ]);
  });

  test('без courseId — кнопки-моста нет, только «Прервать»', async () => {
    const { story, sender } = makeStory();

    const sub = story
      .getEventSubscriptions()
      .find((s) => s.eventName === 'questionnaire:continue-invite')!;

    await sub.handle({
      eventName: 'questionnaire:continue-invite',
      payload: {
        questionnaireId: 'q-1',
        respondentId: 'r-1',
        telegramId: 456,
      },
      ownerInfo: {},
    } as never);

    const [, payload] = sender.invite.mock.calls[0] as unknown as [
      number,
      { keyboard: { rows: { text: string; code: string }[][] } },
    ];
    expect(payload.keyboard.rows.flat().map((b) => [b.text, b.code])).toEqual([
      ['⏭️ Прервать', 'questionnaire:fill:cancel:q-1'],
    ]);
  });
});
