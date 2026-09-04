import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import type { U7BotApp } from '@u7-scl/bot/u7-bot-app-meta';
import {
  assertMarkdownV2Safe,
  type Logger,
  LogLevel,
  setGlobalLogger,
} from '@u7-scl/core/shared';
import type { BotResponse, SessionData } from '@u7-scl/core/ui';
import { FillStory } from './fill.story';

/**
 * UX неактуальных ответов (spec FR-1): stale_answer → перерисовка
 * актуального вопроса с пояснением по reason; флоу не отпускает ввод
 * (releaseInput отсутствует); наблюдаемость через logger.warn.
 */
//
// ══ Помощники ══

const actor = { uuid: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee' } as User;

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

function makeStory(
  execute: (name: string, cmd: unknown, actorId: string) => Promise<unknown>,
) {
  const appApi = { execute: mock(execute) } as unknown as U7BotApp;
  const story = new FillStory();
  const sender = {
    send: mock(async () => {}),
    notify: mock(async () => {}),
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

function staleResponse(overrides: Record<string, unknown> = {}) {
  return {
    type: 'stale_answer',
    questionnaireId: 'q-1',
    question: multiQuestion,
    selectedAnswers: [],
    reason: 'stale_button',
    questionIndex: 1,
    poolSize: 2,
    ...overrides,
  };
}

describe('FillStory UX — stale_answer (неактуальный ответ)', () => {
  let mockLogger: Logger & { warn: ReturnType<typeof mock> };

  beforeEach(() => {
    mockLogger = createMockLogger();
    setGlobalLogger(mockLogger);
  });

  afterEach(() => {
    setGlobalLogger(undefined as unknown as Logger);
  });

  test('stale_button → editMessage актуального вопроса с пояснением, клавиатура жива', async () => {
    const { story } = makeStory(async () => staleResponse());
    const session = fillSession();

    const res: BotResponse = await story.handleCallback(
      'answer:q-1:alien',
      actor,
      session,
    );

    // Перерисовка того же сообщения
    expect(res.editMessage).toBeDefined();
    expect(res.editMessage?.messageId).toBe(42);
    expect(res.sendMessage).toBeUndefined();
    expect(() => assertMarkdownV2Safe(res.editMessage!.text)).not.toThrow();

    // Пояснение по reason + актуальный вопрос
    expect(res.editMessage?.text).toContain('относится к предыдущему вопросу');
    expect(res.editMessage?.text).toContain('Что интересно?');

    // Клавиатура сохранена — флоу продолжается
    const texts = res.editMessage?.keyboard?.rows.flat().map((b) => b.text);
    expect(texts).toContain('1');
    expect(texts).toContain('2');

    // Флоу НЕ отпускает ввод
    expect(res.releaseInput).toBeUndefined();
  });

  test('empty_selection → пояснение про выбор варианта', async () => {
    const { story } = makeStory(async () =>
      staleResponse({ reason: 'empty_selection' }),
    );
    const session = fillSession();

    const res = await story.handleCallback('next:q-1:qc1', actor, session);

    expect(res.editMessage?.text).toContain('выбери хотя бы один вариант');
    expect(res.editMessage?.text).toContain('Что интересно?');
    expect(res.releaseInput).toBeUndefined();
    expect(() => assertMarkdownV2Safe(res.editMessage!.text)).not.toThrow();
  });

  test('stale_answer с драфтом: маркер выбора и кнопка «Далее» сохранены', async () => {
    const { story } = makeStory(async () =>
      staleResponse({
        reason: 'stale_button',
        selectedAnswers: ['fe'],
        nextButton: 'next:qc1',
      }),
    );
    const session = fillSession();

    const res = await story.handleCallback('answer:q-1:alien', actor, session);

    expect(res.editMessage?.text).toContain('\\[x\\]');
    const texts = res.editMessage?.keyboard?.rows.flat().map((b) => b.text);
    expect(texts).toContain('Далее -->');
  });

  test('fallback без lastBotMessage → sendMessage с тем же пояснением', async () => {
    const { story } = makeStory(async () => staleResponse());
    const session = { activeHandler: null } as unknown as SessionData;

    const res = await story.handleCallback('answer:q-1:alien', actor, session);

    expect(res.sendMessage).toBeDefined();
    expect(res.editMessage).toBeUndefined();
    expect(res.sendMessage?.text).toContain('относится к предыдущему вопросу');
    expect(res.sendMessage?.text).toContain('Что интересно?');
    expect(() => assertMarkdownV2Safe(res.sendMessage!.text)).not.toThrow();
  });

  test('logger.warn фиксирует нажатое значение и актуальный вопрос', async () => {
    const { story } = makeStory(async () => staleResponse());
    const session = fillSession();

    await story.handleCallback('answer:q-1:alien', actor, session);

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

  test('текстовый ввод тоже логируется при stale', async () => {
    const { story } = makeStory(async () =>
      staleResponse({ reason: 'stale_button' }),
    );
    const session = fillSession();

    await story.handleMessage(
      { type: 'message', text: 'произвольный текст', telegramId: 1 },
      actor,
      session,
    );

    expect(mockLogger.warn).toHaveBeenCalledTimes(1);
    const [, , meta] = mockLogger.warn.mock.calls[0] as [
      string,
      string,
      Record<string, unknown>,
    ];
    expect(meta.pressed).toBe('произвольный текст');
  });
});
