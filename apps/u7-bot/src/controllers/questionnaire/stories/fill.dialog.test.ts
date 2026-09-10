import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import type { U7BotApp } from '@u7-scl/bot/u7-bot-app-meta';
import {
  assertMarkdownV2Safe,
  type Logger,
  LogLevel,
  setGlobalLogger,
} from '@u7-scl/core/shared';
import {
  AppException,
  errBadRequest,
} from '@u7-scl/core/domain';
import type { BotSession, DialogResponse } from '@u7-scl/core/ui';
import { FillStory } from './fill.story';

/**
 * Поведенческие тесты FillStory на контракте «Диалог и Экран»
 * (DialogResponse): finalize-паттерн («зафиксируй выбор → следующий
 * вопрос»), awaitInput/release, валидация ответов — errorNotify
 * (переспрос, ввод живёт).
 *
 * Контракт ввода: fill-диалог ставит awaitInput{context:{questionnaireId}}
 * при входе; последующие ответы НИЧЕГО не переустанавливают (input живёт),
 * пока не придёт release при завершении анкеты.
 */
//
// ══ Помощники ══

const actor = { uuid: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee' } as User;

const radioQuestion = {
  questionCode: 'qc1',
  type: 'choice' as const,
  multiple: false,
  question: 'Какой у тебя опыт?',
  answers: [
    { answer: 'Новичок', answerCode: 'novice' },
    { answer: 'Средний', answerCode: 'mid' },
  ],
};

const nextTextQuestion = {
  questionCode: 'qc2',
  type: 'text' as const,
  question: 'Расскажи о себе',
};

/** Сессия активного fill-диалога: ожидание ввода с анкетой q-1. */
function fillSession(): BotSession {
  return {
    dialog: {
      path: 'questionnaire/fill',
      seq: 4,
      input: { context: { questionnaireId: 'q-1' } },
    },
    screen: { messageId: 42, ownerSeq: 3, text: 'Вопрос' },
  };
}

/** Сессия чужого диалога (меню) — fill неактивна. */
function menuSession(): BotSession {
  return { dialog: { path: 'app/menu', seq: 2 } };
}

function makeStory(
  execute: (name: string, cmd: unknown, actorId: string) => Promise<unknown>,
) {
  const appApi = { execute: mock(execute) } as unknown as U7BotApp;
  const story = new FillStory();
  const sender = {
    notify: mock(async () => {}),
    invite: mock(async () => {}),
    kickFromGroup: mock(async () => {}),
  };
  story.init({ appApi } as never, sender);
  return { story, appApi };
}

function createMockLogger(): Logger & { warn: ReturnType<typeof mock> } {
  return {
    debug: mock(() => {}),
    info: mock(() => {}),
    warn: mock(() => {}),
    error: mock(() => {}),
    setLogLevel: mock(() => {}),
    getLogLevel: mock(() => LogLevel.DEBUG),
    setSourceLevel: mock(() => {}),
  } as unknown as Logger & { warn: ReturnType<typeof mock> };
}

/** Ошибка UC как из домена: bad-request (текст при choice-вопросе). */
function badRequest(message: string): AppException {
  return new AppException(errBadRequest('BAD_REQUEST', message));
}

// ══ Finalize-паттерн ══

describe('FillStory — finalize-паттерн («зафиксируй выбор → следующий вопрос»)', () => {
  test('single answer: finalize с финальными маркерами \\(x\\)/\\( \\), screen — следующий вопрос, ввод живёт', async () => {
    const { story, appApi } = makeStory(async () => ({
      type: 'new_question',
      questionnaireId: 'q-1',
      question: nextTextQuestion,
      previousQuestion: radioQuestion,
      previousSelectedAnswers: ['novice'],
      questionIndex: 2,
      poolSize: 2,
    }));

    const res = await story.handleCallback(
      'answer:q-1:novice',
      actor,
      fillSession(),
    );

    // UC вызван с выбором варианта
    expect(appApi.execute).toHaveBeenCalledWith(
      'handle-action',
      { questionnaireId: 'q-1', type: 'callback', value: 'novice' },
      actor.uuid,
    );

    // Предыдущий вопрос зафиксирован: выбранный отмечен, прочие — нет
    expect(res.finalize).toBeDefined();
    expect(res.finalize?.text).toContain('\\(x\\)');
    expect(res.finalize?.text).toContain('\\( \\)');
    expect(res.finalize?.text).toContain('Какой у тебя опыт?');
    expect(() => assertMarkdownV2Safe(res.finalize!.text)).not.toThrow();

    // Новый вопрос на экране
    expect(String(res.screen?.text)).toContain('Расскажи о себе');

    // Ввод живёт: ни повторный awaitInput, ни release
    expect(res.awaitInput).toBeUndefined();
    expect(res.release).toBeUndefined();
  });

  test('multiple «Далее»: finalize с маркерами \\[x\\] экрана мультивыбора', async () => {
    const { story } = makeStory(async () => ({
      type: 'new_question',
      questionnaireId: 'q-1',
      question: nextTextQuestion,
      previousQuestion: {
        questionCode: 'qc1',
        type: 'choice' as const,
        multiple: true,
        question: 'Что интересно?',
        answers: [
          { answer: 'Фронтенд', answerCode: 'fe' },
          { answer: 'Бэкенд', answerCode: 'be' },
        ],
      },
      previousSelectedAnswers: ['fe', 'be'],
    }));

    const res = await story.handleCallback(
      'next:q-1:qc1',
      actor,
      fillSession(),
    );

    expect(res.finalize?.text).toContain('\\[x\\]');
    expect(res.finalize?.text).toContain('Что интересно?');
    expect(res.screen).toBeDefined();
  });

  test('текстовый ответ: finalize предыдущего вопроса + screen следующего', async () => {
    const { story, appApi } = makeStory(async () => ({
      type: 'new_question',
      questionnaireId: 'q-1',
      question: nextTextQuestion,
      previousQuestion: radioQuestion,
      previousSelectedAnswers: [],
    }));

    const res = await story.handleMessage(
      { type: 'message', text: '3 года фронтенда', telegramId: 1 },
      actor,
      fillSession(),
    );

    // UC вызван с type:'text' и значением из сообщения
    expect(appApi.execute).toHaveBeenCalledWith(
      'handle-action',
      { questionnaireId: 'q-1', type: 'text', value: '3 года фронтенда' },
      actor.uuid,
    );

    expect(res.finalize?.text).toContain('Какой у тебя опыт?');
    expect(String(res.screen?.text)).toContain('Расскажи о себе');
    expect(res.release).toBeUndefined();
  });

  test('completed: finalize + completionText + главное меню + release', async () => {
    const { story } = makeStory(async () => ({
      type: 'completed',
      questionnaireId: 'q-1',
      previousQuestion: nextTextQuestion,
      previousSelectedAnswers: [],
      completionText: 'Спасибо! Анкета принята.',
    }));

    const res = await story.handleCallback(
      'answer:q-1:novice',
      actor,
      fillSession(),
    );

    expect(res.finalize?.text).toContain('Расскажи о себе');
    expect(String(res.screen?.text)).toContain('Спасибо! Анкета принята.');
    expect(res.release).toBe(true);
  });

  test('completed без предыдущего вопроса: только screen + release, без finalize', async () => {
    const { story } = makeStory(async () => ({
      type: 'completed',
      questionnaireId: 'q-1',
    }));

    const res = await story.handleCallback(
      'answer:q-1:novice',
      actor,
      fillSession(),
    );

    expect(res.finalize).toBeUndefined();
    expect(res.screen).toBeDefined();
    expect(res.release).toBe(true);
  });

  test('fallback completionText: «Спасибо! Твоя анкета принята.»', async () => {
    const { story } = makeStory(async () => ({
      type: 'completed',
      questionnaireId: 'q-1',
    }));

    const res = await story.handleCallback(
      'answer:q-1:novice',
      actor,
      fillSession(),
    );

    expect(String(res.screen?.text)).toContain('Твоя анкета принята');
  });

  test('wait_next (тоггл): только screen без finalize — edit-in-place, клавиатура жива', async () => {
    const { story } = makeStory(async () => ({
      type: 'wait_next',
      questionnaireId: 'q-1',
      currentQuestion: {
        questionCode: 'qc1',
        type: 'choice' as const,
        multiple: true,
        question: 'Что интересно?',
        answers: [
          { answer: 'Фронтенд', answerCode: 'fe' },
          { answer: 'Бэкенд', answerCode: 'be' },
        ],
      },
      selectedAnswers: ['fe'],
      nextButton: 'next:qc1',
    }));

    const res = await story.handleCallback('answer:q-1:fe', actor, fillSession());

    // Тоггл — тот же экран: без finalize, клавиатура жива
    expect(res.finalize).toBeUndefined();
    expect(res.screen?.keyboard).toBeDefined();
    expect(String(res.screen?.text)).toContain('\\[x\\]');
    expect(res.release).toBeUndefined();
    expect(res.awaitInput).toBeUndefined();
  });
});

// ══ awaitInput при входе в диалог ══

describe('FillStory — awaitInput при входе', () => {
  test('первый вопрос (без предыдущего): подсказка /cancel + awaitInput', async () => {
    const { story } = makeStory(async () => ({
      type: 'new_question',
      questionnaireId: 'q-1',
      question: radioQuestion,
      questionIndex: 1,
      poolSize: 3,
    }));

    const res = await story.handleCallback('current:q-1', actor, menuSession());

    expect(String(res.screen?.text)).toContain('/cancel');
    expect(res.awaitInput?.context).toEqual({ questionnaireId: 'q-1' });
  });

  test('не первый вопрос: без подсказки /cancel', async () => {
    const { story } = makeStory(async () => ({
      type: 'new_question',
      questionnaireId: 'q-1',
      question: nextTextQuestion,
      previousQuestion: radioQuestion,
      previousSelectedAnswers: ['novice'],
      questionIndex: 2,
      poolSize: 3,
    }));

    const res = await story.handleCallback('current:q-1', actor, menuSession());

    expect(String(res.screen?.text)).not.toContain('/cancel');
  });
});

// ══ Валидация — errorNotify (ввод живёт) ══

describe('FillStory — валидация ответов: errorNotify-переспрос', () => {
  test('текст при choice-вопросе (bad-request UC): warn-реплика, экран не трогаем, ввод живёт', async () => {
    const { story } = makeStory(async () => {
      throw badRequest('Ожидался ответ с выбором (нажатием кнопки)');
    });

    const res = await story.handleMessage(
      { type: 'message', text: 'какой-то текст', telegramId: 1 },
      actor,
      fillSession(),
    );

    expect(res.notify?.kind).toBe('warn');
    expect(res.notify?.text).toContain('Ожидался ответ с выбором');
    expect(res.screen).toBeUndefined();
    expect(res.finalize).toBeUndefined();
    // Переспрос: ввод НЕ отпущен
    expect(res.release).toBeUndefined();
    expect(res.awaitInput).toBeUndefined();
  });

  test('internal-ошибка UC: общая реплика без утечки деталей, ввод живёт', async () => {
    const { story } = makeStory(async () => {
      throw new Error('секретная внутренняя деталь');
    });

    const res = await story.handleCallback(
      'answer:q-1:novice',
      actor,
      fillSession(),
    );

    expect(res.notify?.kind).toBe('warn');
    expect(res.notify?.text).not.toContain('секретная');
    expect(res.release).toBeUndefined();
  });
});

// ══ stale_answer — warn-реплика без перерисовки ══

describe('FillStory — stale_answer: реплика поверх, экран и ввод не трогаем', () => {
  let mockLogger: Logger & { warn: ReturnType<typeof mock> };

  beforeEach(() => {
    mockLogger = createMockLogger();
    setGlobalLogger(mockLogger);
  });

  afterEach(() => {
    setGlobalLogger(undefined as unknown as Logger);
  });

  const staleResponse = (overrides: Record<string, unknown> = {}) => ({
    type: 'stale_answer',
    questionnaireId: 'q-1',
    question: radioQuestion,
    selectedAnswers: [],
    reason: 'stale_button',
    ...overrides,
  });

  test('stale_button: warn-реплика «относится к предыдущему вопросу», без перерисовки', async () => {
    const { story } = makeStory(async () => staleResponse());

    const res = await story.handleCallback(
      'answer:q-1:alien',
      actor,
      fillSession(),
    );

    expect(res.notify?.kind).toBe('warn');
    expect(res.notify?.text).toContain('относится к предыдущему вопросу');
    expect(res.screen).toBeUndefined();
    expect(res.finalize).toBeUndefined();
    expect(res.release).toBeUndefined();
  });

  test('empty_selection: warn-реплика «выбери хотя бы один вариант»', async () => {
    const { story } = makeStory(async () =>
      staleResponse({ reason: 'empty_selection' }),
    );

    const res = await story.handleCallback('next:q-1:qc1', actor, fillSession());

    expect(res.notify?.kind).toBe('warn');
    expect(res.notify?.text).toContain('выбери хотя бы один вариант');
    expect(res.release).toBeUndefined();
  });

  test('наблюдаемость: logger.warn с нажатым значением, вопросом и причиной', async () => {
    const { story } = makeStory(async () => staleResponse());

    await story.handleCallback('answer:q-1:alien', actor, fillSession());

    expect(mockLogger.warn).toHaveBeenCalledTimes(1);
    const [source, message, meta] = mockLogger.warn.mock.calls[0] as [
      string,
      string,
      Record<string, unknown>,
    ];
    expect(source).toBe('fill-story');
    expect(message).toContain('Неактуальный ответ');
    expect(meta.pressed).toBe('alien');
    expect(meta.questionCode).toBe('qc1');
    expect(meta.reason).toBe('stale_button');
    expect(meta.questionnaireId).toBe('q-1');
  });
});

// ══ Команда /cancel — подтверждение перед abandon ══

describe('FillStory — /cancel: подтверждение перед прерыванием', () => {
  test('активная fill: stop с confirm-экраном, abandon НЕ вызывается', async () => {
    const { story, appApi } = makeStory(async (name) => {
      if (name === 'get-current') {
        return {
          type: 'new_question',
          questionnaireId: 'q-1',
          question: radioQuestion,
          cancelWarning: 'Данные не сохранятся.',
        };
      }
      throw new Error(`Неожиданный UC: ${name}`);
    });

    const reaction = await story.handleCommand(
      { type: 'command', command: 'cancel', args: '', telegramId: 1 },
      actor,
      fillSession(),
    );

    expect(reaction.reaction).toBe('stop');
    const res = (reaction as { response: DialogResponse }).response;

    expect(String(res.screen?.text)).toContain('Вы уверены, что хотите прервать анкету?');
    expect(String(res.screen?.text)).toContain('Данные не сохранятся');

    const flat = res.screen?.keyboard?.rows.flat() ?? [];
    expect(flat.map((b) => [b.text, b.code])).toEqual([
      ['✅ Да, прервать', 'fill:cancel-confirm:q-1'],
      ['❌ Нет, продолжить', 'fill:current:q-1'],
    ]);

    // Прерывание — только после подтверждения: abandon не звали
    const ucNames = (appApi.execute.mock.calls as unknown[][]).map((c) => c[0]);
    expect(ucNames).not.toContain('abandon');
  });

  test('get-current недоступен (анкеты нет): дефолтный сброс «Отменено. Наберите /start»', async () => {
    const { story } = makeStory(async () => {
      throw badRequest('Анкета уже завершена');
    });

    const reaction = await story.handleCommand(
      { type: 'command', command: 'cancel', args: '', telegramId: 1 },
      actor,
      fillSession(),
    );

    expect(reaction.reaction).toBe('stop');
    const res = (reaction as { response: DialogResponse }).response;
    expect(res.notify?.text).toContain('Отменено');
    expect(res.screen).toBeUndefined();
  });

  test('неактивная fill: pass без побочных действий', async () => {
    const { story, appApi } = makeStory(async () => ({}));

    const reaction = await story.handleCommand(
      { type: 'command', command: 'cancel', args: '', telegramId: 1 },
      actor,
      menuSession(),
    );

    expect(reaction).toEqual({ reaction: 'pass' });
    expect(appApi.execute).not.toHaveBeenCalled();
  });

  test('прочая команда (/help): pass — дефолт контракта U7BotUiStory', async () => {
    const { story } = makeStory(async () => ({}));

    const reaction = await story.handleCommand(
      { type: 'command', command: 'help', args: '', telegramId: 1 },
      actor,
      fillSession(),
    );

    expect(reaction).toEqual({ reaction: 'pass' });
  });
});
