import { describe, expect, mock, test } from 'bun:test';
import { assertMarkdownV2Safe } from '@u7-scl/core/shared';
import { FillStory } from './fill.story';

/**
 * Подписка questionnaire:abandon-warning (S07, ступень 6ч планировщика)
 * и questionnaire:abandon (S08) на контракте «Диалог и Экран»:
 * кнопочный проактив — ТОЛЬКО канал invite (ФР-6, «никогда срезка в
 * notify»), полные коды кнопок (транспорт проактивы не префиксует),
 * подсказка /start на случай устаревшего экрана. Прерывание — через
 * confirm-экран (fill:cancel), не сразу abandon.
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

function warningEvent(overrides: Record<string, unknown> = {}) {
  return {
    eventName: 'questionnaire:abandon-warning',
    payload: {
      questionnaireId: 'q-1',
      respondentId: 'r-1',
      telegramId: 456,
    },
    ownerInfo: { courseId: 'course-1' },
    ...overrides,
  };
}

describe('FillStory — abandon-warning (S07): invite-канал', () => {
  test('подписки включают questionnaire:abandon-warning и questionnaire:abandon', () => {
    const { story } = makeStory();
    const names = story.getEventSubscriptions().map((s) => s.eventName);
    expect(names).toContain('questionnaire:abandon-warning');
    expect(names).toContain('questionnaire:abandon');
  });

  test('с courseId: кнопки «Продолжить» (мост resume) и «Прервать» (confirm), подсказка /start', async () => {
    const { story, sender } = makeStory();

    const sub = story
      .getEventSubscriptions()
      .find((s) => s.eventName === 'questionnaire:abandon-warning')!;

    await sub.handle(warningEvent() as never);

    expect(sender.invite).toHaveBeenCalledTimes(1);
    const [telegramId, payload] = sender.invite.mock.calls[0] as unknown as [
      number,
      { text: string; keyboard: { rows: { text: string; code: string }[][] } },
    ];
    expect(telegramId).toBe(456);

    expect(payload.text).toContain('Анкета приостановлена');
    expect(payload.text).toContain('Скоро она будет закрыта');
    expect(payload.text).toContain('/start');
    expect(() => assertMarkdownV2Safe(payload.text)).not.toThrow();

    expect(payload.keyboard.rows.flat().map((b) => [b.text, b.code])).toEqual([
      ['▶️ Продолжить', 'questionnaire:fill:resume:course-1'],
      ['⏭️ Прервать', 'questionnaire:fill:cancel:q-1'],
    ]);
  });

  test('без courseId — кнопка только «Прервать»', async () => {
    const { story, sender } = makeStory();

    const sub = story
      .getEventSubscriptions()
      .find((s) => s.eventName === 'questionnaire:abandon-warning')!;

    await sub.handle(warningEvent({ ownerInfo: {} }) as never);

    const [, payload] = sender.invite.mock.calls[0] as unknown as [
      number,
      { keyboard: { rows: { text: string; code: string }[][] } },
    ];
    expect(payload.keyboard.rows.flat().map((b) => [b.text, b.code])).toEqual([
      ['⏭️ Прервать', 'questionnaire:fill:cancel:q-1'],
    ]);
  });
});

describe('FillStory — abandon (S08): notify о закрытии по таймауту', () => {
  test('reason=timeout — notify без кнопок', async () => {
    const { story, sender } = makeStory();

    const sub = story
      .getEventSubscriptions()
      .find((s) => s.eventName === 'questionnaire:abandon')!;

    await sub.handle({
      eventName: 'questionnaire:abandon',
      payload: { reason: 'timeout', questionnaireId: 'q-1', telegramId: 456 },
    } as never);

    expect(sender.invite).not.toHaveBeenCalled();
    expect(sender.notify).toHaveBeenCalledTimes(1);
    const [telegramId, payload] = sender.notify.mock.calls[0] as unknown as [
      number,
      { text: string },
    ];
    expect(telegramId).toBe(456);
    expect(payload.text).toContain('длительной неактивности');
    expect(() => assertMarkdownV2Safe(payload.text)).not.toThrow();
  });

  test('reason=by_user (ручное прерывание) — дубля нет, ничего не шлём', async () => {
    const { story, sender } = makeStory();

    const sub = story
      .getEventSubscriptions()
      .find((s) => s.eventName === 'questionnaire:abandon')!;

    await sub.handle({
      eventName: 'questionnaire:abandon',
      payload: { reason: 'by_user', questionnaireId: 'q-1', telegramId: 456 },
    } as never);

    expect(sender.notify).not.toHaveBeenCalled();
    expect(sender.invite).not.toHaveBeenCalled();
  });

  test('timeout без telegramId — слать некому', async () => {
    const { story, sender } = makeStory();

    const sub = story
      .getEventSubscriptions()
      .find((s) => s.eventName === 'questionnaire:abandon')!;

    await sub.handle({
      eventName: 'questionnaire:abandon',
      payload: { reason: 'timeout', questionnaireId: 'q-1' },
    } as never);

    expect(sender.notify).not.toHaveBeenCalled();
  });
});
