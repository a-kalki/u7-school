import { describe, expect, mock, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import type { U7BotApp } from '@u7-scl/bot/u7-bot-app-meta';
import type { BotCommand, SessionData } from '@u7-scl/core/ui';
import { FillStory } from './fill.story';

/**
 * UX мультивыбора: тоггл и «Далее» редактируют сообщение на месте
 * (контракты editMessage/sendMessage, см. spec FR-2).
 */
//
// ══ Помощники ══

const actor = { uuid: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee' } as User;

/** Множественный выбор: два варианта. */
const multiQuestion = {
  questionCode: 'qc1',
  type: 'choice' as const,
  multiple: true,
  question: 'Что интересно?',
  answers: [
    { answer: 'Фронтенд', answerCode: 'fe' },
    { answer: 'Бэкенд', answerCode: 'be' },
  ],
};

/** Следующий (текстовый) вопрос. */
const nextTextQuestion = {
  questionCode: 'qc2',
  type: 'text' as const,
  question: 'Расскажи о себе',
};

/** Сессия в контексте анкеты: активный флоу fill + вопрос как последнее сообщение. */
function fillSession(lastBotMessageId = 42): SessionData {
  return {
    activeHandler: {
      path: 'questionnaire/fill',
      context: { questionnaireId: 'q-1' },
    },
    lastBotMessage: {
      messageId: lastBotMessageId,
      text: 'Вопрос',
      keyboard: { rows: [[{ text: '1', code: 'x' }]], isMultiple: true },
    },
  } as unknown as SessionData;
}

/** Story с моком API приложения (конвенция fill.story.test.ts). */
function makeStory(
  execute: (name: string, cmd: unknown, actorId: string) => Promise<unknown>,
) {
  const appApi = { execute: mock(execute) } as unknown as U7BotApp;
  const story = new FillStory();
  const sender = { send: mock(async () => {}), notify: mock(async () => {}) };
  story.init({ appApi } as never, sender);
  return { story, appApi, sender };
}

function waitNextResponse(overrides: Record<string, unknown> = {}) {
  return {
    type: 'wait_next',
    questionnaireId: 'q-1',
    currentQuestion: multiQuestion,
    selectedAnswers: ['fe'],
    nextButton: 'next:qc1',
    questionIndex: 1,
    poolSize: 2,
    ...overrides,
  };
}

// ══ Тоггл варианта — editMessage на месте ══

describe('FillStory UX — тоггл мультивыбора (editMessage на месте)', () => {
  test('выбор варианта → editMessage того же сообщения, клавиатура сохранена', async () => {
    const { story } = makeStory(async () => waitNextResponse());
    const session = fillSession();

    const res = await story.handleCallback('answer:q-1:fe', actor, session);

    // Редактируется ТО же сообщение (messageId из session.lastBotMessage)
    expect(res.editMessage).toBeDefined();
    expect(res.editMessage?.messageId).toBe(42);
    expect(res.sendMessage).toBeUndefined();

    // Маркеры обновлены: [x] у выбранного, [ ] у остальных
    expect(res.editMessage?.text).toContain('\\[x\\]');
    expect(res.editMessage?.text).toContain('\\[ \\]');
    expect(res.editMessage?.text).toContain('Что интересно?');

    // Клавиатура остаётся (варианты + «Далее»)
    const codes = res.editMessage?.keyboard?.rows.flat().map((b) => b.text);
    expect(codes).toContain('1');
    expect(codes).toContain('2');
    expect(codes).toContain('Далее -->');
  });

  test('кнопка «Далее» исчезает, когда сняты все варианты', async () => {
    const { story } = makeStory(async () =>
      waitNextResponse({ selectedAnswers: [], nextButton: undefined }),
    );
    const session = fillSession();

    const res = await story.handleCallback('answer:q-1:fe', actor, session);

    expect(res.editMessage).toBeDefined();
    const texts = res.editMessage?.keyboard?.rows.flat().map((b) => b.text);
    expect(texts).toContain('1');
    expect(texts).not.toContain('Далее -->');
  });

  test('кнопка «Далее» присутствует, когда выбран хотя бы один вариант', async () => {
    const { story } = makeStory(async () => waitNextResponse());
    const session = fillSession();

    const res = await story.handleCallback('answer:q-1:be', actor, session);

    const texts = res.editMessage?.keyboard?.rows.flat().map((b) => b.text);
    expect(texts).toContain('Далее -->');
  });

  test('fallback: без session.lastBotMessage (проактив/resume) — sendMessage', async () => {
    const { story } = makeStory(async () => waitNextResponse());
    const session = { activeHandler: null } as unknown as SessionData;

    const res = await story.handleCallback('answer:q-1:fe', actor, session);

    expect(res.sendMessage).toBeDefined();
    expect(res.editMessage).toBeUndefined();
    expect(res.sendMessage?.text).toContain('Что интересно?');
  });
});

// ══ «Далее» — финальные маркеры без клавиатуры + новый вопрос ══

describe('FillStory UX — кнопка «Далее» (edit + новое сообщение)', () => {
  test('«Далее» → editMessage текущего вопроса (финальные маркеры, БЕЗ клавиатуры) + sendMessage следующего', async () => {
    const { story } = makeStory(async () => ({
      type: 'new_question',
      questionnaireId: 'q-1',
      question: nextTextQuestion,
      previousQuestion: multiQuestion,
      previousSelectedAnswers: ['fe', 'be'],
      questionIndex: 2,
      poolSize: 2,
    }));
    const session = fillSession();

    const res = await story.handleCallback('next:q-1:qc1', actor, session);

    // История: предыдущий вопрос отредактирован — финальные маркеры, без клавиатуры
    expect(res.editMessage?.messageId).toBe(42);
    expect(res.editMessage?.text).toContain('Что интересно?');
    expect(res.editMessage?.text).toContain('\\[x\\]');
    expect(res.editMessage?.keyboard).toBeUndefined();

    // Следующий вопрос — новым сообщением
    expect(res.sendMessage?.text).toContain('Расскажи о себе');
  });

  test('«Далее» с последним вопросом → editMessage с маркерами + sendMessage completed', async () => {
    const { story } = makeStory(async () => ({
      type: 'completed',
      questionnaireId: 'q-1',
      previousQuestion: multiQuestion,
      previousSelectedAnswers: ['fe'],
      completionText: 'Спасибо! Анкета принята.',
    }));
    const session = fillSession();

    const res = await story.handleCallback('next:q-1:qc1', actor, session);

    expect(res.releaseInput).toBe(true);
    expect(res.editMessage?.messageId).toBe(42);
    expect(res.editMessage?.text).toContain('\\[x\\]');
    expect(res.editMessage?.keyboard).toBeUndefined();
    expect(res.sendMessage?.text).toContain('Анкета принята');
  });

  test('текстовый ответ → editMessage вопроса (без клавиатуры) + sendMessage следующего', async () => {
    const { story } = makeStory(async () => ({
      type: 'new_question',
      questionnaireId: 'q-1',
      question: nextTextQuestion,
      previousQuestion: {
        questionCode: 'qc0',
        type: 'text' as const,
        question: 'Как тебя зовут?',
      },
      previousSelectedAnswers: [],
      questionIndex: 2,
      poolSize: 2,
    }));
    const session = fillSession();

    const res = await story.handleMessage(
      { type: 'message', text: 'Иван', telegramId: 1 },
      actor,
      session,
    );

    expect(res.editMessage?.messageId).toBe(42);
    expect(res.editMessage?.text).toContain('Как тебя зовут?');
    expect(res.editMessage?.keyboard).toBeUndefined();
    expect(res.sendMessage?.text).toContain('Расскажи о себе');
  });

  test('fallback «Далее»: без lastBotMessage — только sendMessage нового вопроса', async () => {
    const { story } = makeStory(async () => ({
      type: 'new_question',
      questionnaireId: 'q-1',
      question: nextTextQuestion,
      previousQuestion: multiQuestion,
      previousSelectedAnswers: ['fe'],
    }));
    const session = { activeHandler: null } as unknown as SessionData;

    const res = await story.handleCallback('next:q-1:qc1', actor, session);

    expect(res.editMessage).toBeUndefined();
    expect(res.sendMessage?.text).toContain('Расскажи о себе');
  });
});

// ══ Проактивный рендер не зависит от сессии ══

describe('FillStory UX — проактивный старт (questionnaire:start)', () => {
  test('new_question через событие — sendMessage (editMessage невозможен)', async () => {
    const { story, sender } = makeStory(async () => ({}));

    const startSub = story
      .getEventSubscriptions()
      .find((s) => s.eventName === 'questionnaire:start');

    await startSub!.handle({
      eventName: 'questionnaire:start',
      payload: {
        telegramId: 456,
        response: {
          type: 'new_question',
          questionnaireId: 'q1',
          question: multiQuestion,
        },
      },
    } as never);

    expect(sender.send).toHaveBeenCalled();
    const [, command] = sender.send.mock.calls[0] as unknown as [
      number,
      BotCommand,
    ];
    expect(command.sendMessage?.text).toContain('Что интересно?');
    expect(command.editMessage).toBeUndefined();
  });
});
