import { describe, expect, mock, test } from 'bun:test';
import type { BotCommand } from '@u7-scl/core/ui';
import type { QuestionnaireApiModule } from '@u7-scl/questionnaire/api';
import { FillStory } from './fill.story';

/**
 * FillStory с мок-отправителем (конвенция fill.story.test.ts).
 * Обработчики событий рендерят и шлют — resolve не нужен.
 */
function makeStory() {
  const story = new FillStory({} as QuestionnaireApiModule);
  const sender = { send: mock(async () => {}), notify: mock(async () => {}) };
  story.init({} as never, sender);
  return { story, sender };
}

function getSub(story: FillStory, eventName: string) {
  return story.getEventSubscriptions().find((s) => s.eventName === eventName);
}

describe('FillStory — предупреждение о брошенной анкете', () => {
  test('подписки включают questionnaire:abandon-warning и questionnaire:abandon', () => {
    const { story } = makeStory();

    const names = story.getEventSubscriptions().map((s) => s.eventName);

    expect(names).toContain('questionnaire:abandon-warning');
    expect(names).toContain('questionnaire:abandon');
  });

  test('questionnaire:abandon-warning — сообщение с кнопками «Продолжить» и «Прервать»', async () => {
    const { story, sender } = makeStory();
    const sub = getSub(story, 'questionnaire:abandon-warning');
    expect(sub).toBeDefined();

    await sub!.handle({
      eventName: 'questionnaire:abandon-warning',
      aggregateName: 'Questionnaire',
      ownerInfo: { courseId: 'course-1' },
      payload: {
        questionnaireId: 'q-1',
        respondentId: '00000000-0000-0000-0000-000000000007',
        telegramId: 456,
      },
    } as never);

    expect(sender.send).toHaveBeenCalled();
    const [telegramId, command] = sender.send.mock.calls[0] as unknown as [
      number,
      BotCommand,
    ];
    expect(telegramId).toBe(456);
    expect(command.sendMessage?.text).toContain('анкет');

    const buttons =
      command.sendMessage?.keyboard?.rows.flat().map((b) => ({
        text: b.text,
        code: b.code,
      })) ?? [];

    const resume = buttons.find((b) =>
      b.code.startsWith('questionnaire:fill:resume:'),
    );
    expect(resume).toBeDefined();
    expect(resume?.code).toBe('questionnaire:fill:resume:course-1');

    const cancel = buttons.find((b) =>
      b.code.startsWith('fill:cancel-confirm:'),
    );
    expect(cancel).toBeDefined();
    expect(cancel?.code).toBe('fill:cancel-confirm:q-1');
  });

  test('questionnaire:abandon-warning без courseId — кнопка только «Прервать»', async () => {
    const { story, sender } = makeStory();
    const sub = getSub(story, 'questionnaire:abandon-warning');

    await sub!.handle({
      eventName: 'questionnaire:abandon-warning',
      aggregateName: 'Questionnaire',
      ownerInfo: {},
      payload: {
        questionnaireId: 'q-1',
        respondentId: '00000000-0000-0000-0000-000000000007',
        telegramId: 456,
      },
    } as never);

    const command = (sender.send.mock.calls[0] as unknown[])[1] as BotCommand;
    const codes =
      command.sendMessage?.keyboard?.rows.flat().map((b) => b.code) ?? [];
    expect(codes).toEqual(['fill:cancel-confirm:q-1']);
  });

  test('questionnaire:abandon с reason=timeout — notify о закрытии', async () => {
    const { story, sender } = makeStory();
    const sub = getSub(story, 'questionnaire:abandon');
    expect(sub).toBeDefined();

    await sub!.handle({
      eventName: 'questionnaire:abandon',
      aggregateName: 'Questionnaire',
      ownerInfo: {},
      payload: {
        questionnaireId: 'q-1',
        respondentId: '00000000-0000-0000-0000-000000000007',
        reason: 'timeout',
        telegramId: 456,
      },
    } as never);

    expect(sender.notify).toHaveBeenCalled();
    const [telegramId, payload] = sender.notify.mock.calls[0] as unknown as [
      number,
      { text: string },
    ];
    expect(telegramId).toBe(456);
    expect(payload.text).toContain('закрыт');
    // Уведомление без кнопок — не send
    expect(sender.send).not.toHaveBeenCalled();
  });

  test('questionnaire:abandon без reason (ручной /cancel) — дубля нет', async () => {
    const { story, sender } = makeStory();
    const sub = getSub(story, 'questionnaire:abandon');

    await sub!.handle({
      eventName: 'questionnaire:abandon',
      aggregateName: 'Questionnaire',
      ownerInfo: {},
      payload: {
        questionnaireId: 'q-1',
        respondentId: '00000000-0000-0000-0000-000000000007',
        telegramId: 456,
      },
    } as never);

    expect(sender.notify).not.toHaveBeenCalled();
    expect(sender.send).not.toHaveBeenCalled();
  });

  test('questionnaire:abandon timeout без telegramId — ничего не шлём', async () => {
    const { story, sender } = makeStory();
    const sub = getSub(story, 'questionnaire:abandon');

    await sub!.handle({
      eventName: 'questionnaire:abandon',
      aggregateName: 'Questionnaire',
      ownerInfo: {},
      payload: {
        questionnaireId: 'q-1',
        respondentId: '00000000-0000-0000-0000-000000000007',
        reason: 'timeout',
      },
    } as never);

    expect(sender.notify).not.toHaveBeenCalled();
    expect(sender.send).not.toHaveBeenCalled();
  });
});
