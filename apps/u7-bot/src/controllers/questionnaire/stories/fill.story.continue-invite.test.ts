import { describe, expect, mock, test } from 'bun:test';
import type { BotCommand } from '@u7-scl/core/ui';
import { FillStory } from './fill.story';

/**
 * Приглашение продолжить брошенную анкету (ступень 3ч, spec FR-4):
 * «Вы начали заполнять анкету — продолжим?» + takeover-кнопка
 * «▶️ Продолжить анкету» + «⏭️ Прервать».
 */

function makeStory() {
  const story = new FillStory();
  const sender = {
    send: mock(async () => {}),
    notify: mock(async () => {}),
    kickFromGroup: mock(async () => {}),
  };
  story.init({} as never, sender);
  return { story, sender };
}

function getSub(story: FillStory, eventName: string) {
  return story.getEventSubscriptions().find((s) => s.eventName === eventName);
}

function continueInviteEvent(
  ownerInfo: Record<string, unknown> = { courseId: 'course-1' },
) {
  return {
    eventName: 'questionnaire:continue-invite',
    aggregateName: 'Questionnaire',
    ownerInfo,
    payload: {
      questionnaireId: 'q-1',
      respondentId: '00000000-0000-0000-0000-000000000007',
      telegramId: 456,
    },
  } as never;
}

describe('FillStory — приглашение продолжить (questionnaire:continue-invite)', () => {
  test('подписка зарегистрирована', () => {
    const { story } = makeStory();

    const names = story.getEventSubscriptions().map((s) => s.eventName);

    expect(names).toContain('questionnaire:continue-invite');
  });

  test('сообщение «продолжим?» с кнопками «▶️ Продолжить анкету» (takeover) и «⏭️ Прервать»', async () => {
    const { story, sender } = makeStory();
    const sub = getSub(story, 'questionnaire:continue-invite');
    expect(sub).toBeDefined();

    await sub!.handle(continueInviteEvent());

    expect(sender.send).toHaveBeenCalled();
    const [telegramId, command] = sender.send.mock.calls[0] as unknown as [
      number,
      BotCommand,
    ];
    expect(telegramId).toBe(456);
    expect(command.sendMessage?.text).toContain('продолжим');

    const buttons =
      command.sendMessage?.keyboard?.rows.flat().map((b) => ({
        text: b.text,
        code: b.code,
        takeover: b.takeover,
      })) ?? [];

    // Takeover-кнопка «Продолжить анкету» — перехват ввода у чужого флоу
    const resume = buttons.find((b) => b.text.includes('Продолжить анкету'));
    expect(resume).toBeDefined();
    expect(resume?.code).toBe('questionnaire:fill:resume:course-1');
    expect(resume?.takeover).toBe(true);

    const cancel = buttons.find((b) => b.text.includes('Прервать'));
    expect(cancel).toBeDefined();
    expect(cancel?.code).toBe('fill:cancel-confirm:q-1');
    expect(cancel?.takeover).toBeUndefined();
  });

  test('без courseId — takeover-кнопки нет, только «⏭️ Прервать»', async () => {
    const { story, sender } = makeStory();
    const sub = getSub(story, 'questionnaire:continue-invite');

    await sub!.handle(continueInviteEvent({}));

    const command = (sender.send.mock.calls[0] as unknown[])[1] as BotCommand;
    const codes =
      command.sendMessage?.keyboard?.rows.flat().map((b) => b.code) ?? [];
    expect(codes).toEqual(['fill:cancel-confirm:q-1']);
  });
});
