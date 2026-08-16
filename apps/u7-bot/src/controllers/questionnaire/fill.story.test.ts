import { describe, expect, mock, test } from 'bun:test';
import type { BotCommand } from '@u7-scl/core/ui';
import type { QuestionnaireApiModule } from '@u7-scl/questionnaire/api';
import { FillStory } from './fill.story';

/**
 * Создаёт FillStory с мок-отправителем и без реальных модулей.
 *
 * Обработчики событий не вызывают API — только рендерят и шлют через
 * proactiveSender, поэтому resolve можно не заполнять.
 */
function makeStory() {
  const story = new FillStory({} as QuestionnaireApiModule);
  const sender = { send: mock(async () => {}) };
  story.init({} as never, sender);
  return { story, sender };
}

/** Извлекает последний вызов proactiveSender.send. */
function getSentCommand(sender: { send: ReturnType<typeof mock> }): {
  telegramId: number;
  command: BotCommand;
} {
  expect(sender.send).toHaveBeenCalled();
  const [telegramId, command] = sender.send.mock.calls[0] as [
    number,
    BotCommand,
  ];
  return { telegramId, command };
}

describe('FillStory — подписки на доменные события', () => {
  test('getEventSubscriptions возвращает 2 подписки', () => {
    const { story } = makeStory();

    const subs = story.getEventSubscriptions();

    expect(subs.map((s) => s.eventName)).toEqual([
      'questionnaire:start',
      'questionnaire:invite',
    ]);
  });

  test('questionnaire:invite рендерит S01 и шлёт через proactiveSender', async () => {
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
    expect(codes).toEqual(['fill:start:q1', 'fill:why:q1', 'fill:decline:q1']);
  });

  test('questionnaire:start рендерит вопрос и захватывает ввод', async () => {
    const { story, sender } = makeStory();

    const startSub = story
      .getEventSubscriptions()
      .find((s) => s.eventName === 'questionnaire:start');
    expect(startSub).toBeDefined();

    await startSub!.handle({
      eventName: 'questionnaire:start',
      payload: {
        telegramId: 456,
        response: {
          type: 'new_question',
          questionnaireId: 'q1',
          question: {
            questionCode: 'qc1',
            type: 'text',
            question: 'Как вас зовут?',
          },
        },
      },
    } as never);

    const { telegramId, command } = getSentCommand(sender);
    expect(telegramId).toBe(456);
    expect(command.sendMessage?.text).toContain('Как вас зовут?');
    expect(command.captureInput?.path).toBe('questionnaire/fill');
    expect(command.captureInput?.context).toEqual({ questionnaireId: 'q1' });
  });
});
