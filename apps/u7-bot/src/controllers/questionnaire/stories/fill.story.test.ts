import { describe, expect, mock, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import type { U7BotApp } from '@u7-scl/bot/u7-bot-app-meta';
import type { SessionData } from '@u7-scl/core/ui';
import { FillStory } from './fill.story';

/**
 * Создаёт FillStory с моком API приложения.
 *
 * execute имитирует диспетчеризацию UC: поведение задаётся тестом.
 */
function makeStoryWithApi(
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
  return { story, appApi, sender };
}

/** Активная standard-анкета пользователя по курсу. */
function inProgressState(overrides?: Record<string, unknown>) {
  return {
    kind: 'standard',
    uuid: '11111111-2222-4333-8444-555555555555',
    respondentId: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
    status: 'in_progress',
    currentQuestionCode: 'qc1',
    draftAnswers: {},
    answers: [],
    questionPool: { questions: [] },
    ownerInfo: { courseId: 'course-1' },
    ...overrides,
  };
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

describe('FillStory — подписки на доменные события', () => {
  test('getEventSubscriptions возвращает 4 подписки', () => {
    const { story } = makeStoryWithApi(async () => ({}));

    const subs = story.getEventSubscriptions();

    expect(subs.map((s) => s.eventName)).toEqual([
      'questionnaire:start',
      'questionnaire:abandon-warning',
      'questionnaire:continue-invite',
      'questionnaire:abandon',
    ]);
  });

  test('questionnaire:start рендерит вопрос и захватывает ввод', async () => {
    const { story, sender } = makeStoryWithApi(async () => ({}));

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
    expect(command.captureInput?.path).toBe('fill');
    expect(command.captureInput?.context).toEqual({ questionnaireId: 'q1' });
  });
});

describe('FillStory — fill:resume:{courseId}', () => {
  const actor = { uuid: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee' } as User;
  const session = {} as SessionData;

  test('resume: активная анкета найдена — рендер текущего вопроса + captureInput', async () => {
    const { story, appApi } = makeStoryWithApi(async (name, cmd) => {
      if (name === 'get-questionnaires-by-user') {
        return [inProgressState()];
      }
      if (
        name === 'get-current' &&
        (cmd as { questionnaireId: string }).questionnaireId ===
          '11111111-2222-4333-8444-555555555555'
      ) {
        return {
          type: 'new_question',
          questionnaireId: '11111111-2222-4333-8444-555555555555',
          question: {
            questionCode: 'qc1',
            type: 'text',
            question: 'Как тебя зовут?',
          },
        };
      }
      throw new Error(`Неожиданный UC: ${name}`);
    });

    const res = await story.handleCallback('resume:course-1', actor, session);

    expect(res.sendMessage?.text).toContain('Как тебя зовут?');
    expect(res.captureInput?.path).toBe('fill');
    expect(res.captureInput?.context).toEqual({
      questionnaireId: '11111111-2222-4333-8444-555555555555',
    });
    expect(appApi.execute).toHaveBeenCalledTimes(2);
  });

  test('resume: анкета не найдена — сообщение и главное меню', async () => {
    const { story } = makeStoryWithApi(async () => []);

    const res = await story.handleCallback('resume:course-1', actor, session);

    expect(res.sendMessage?.text).toContain('Анкета не найдена');
    const codes =
      res.sendMessage?.keyboard?.rows.flat().map((b) => b.code) ?? [];
    expect(codes).toEqual(['app:main-menu']);
  });

  test('resume: completed и likert-анкеты по тому же курсу игнорируются', async () => {
    const { story } = makeStoryWithApi(async () => [
      inProgressState({ status: 'completed' }),
      inProgressState({ kind: 'likert', status: 'in_progress' }),
    ]);

    const res = await story.handleCallback('resume:course-1', actor, session);

    expect(res.sendMessage?.text).toContain('Анкета не найдена');
  });
});

describe('FillStory — completionText на completed', () => {
  const actor = { uuid: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee' } as User;
  const session = {} as SessionData;

  function completedStory(completionText?: string) {
    return makeStoryWithApi(async (name) => {
      if (name === 'handle-action') {
        return {
          type: 'completed',
          questionnaireId: 'q-1',
          ...(completionText !== undefined ? { completionText } : {}),
        };
      }
      throw new Error(`Неожиданный UC: ${name}`);
    });
  }

  test('completed: рендерит completionText из пула', async () => {
    const { story } = completedStory(
      'Спасибо! Желание пройти курс закреплено.',
    );

    const res = await story.handleCallback('answer:q-1:yes', actor, session);

    expect(res.sendMessage?.text).toBe(
      'Спасибо! Желание пройти курс закреплено.',
    );
  });

  test('completed: без completionText — fallback «на ты»', async () => {
    const { story } = completedStory();

    const res = await story.handleCallback('answer:q-1:yes', actor, session);

    expect(res.sendMessage?.text).toBe('Спасибо! Твоя анкета принята.');
  });
});

describe('FillStory — прогресс анкеты и подсказка /cancel', () => {
  const actor = { uuid: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee' } as User;
  const session = {} as SessionData;

  function questionStory(response: Record<string, unknown>) {
    return makeStoryWithApi(async () => response);
  }

  test('new_question: шапка «Вопрос N из M»', async () => {
    const { story } = questionStory({
      type: 'new_question',
      questionnaireId: 'q-1',
      question: { questionCode: 'qc2', type: 'text', question: 'Второй?' },
      questionIndex: 2,
      poolSize: 3,
    });

    const res = await story.handleCallback('answer:q-1:yes', actor, session);

    expect(res.sendMessage?.text).toContain('Вопрос 2 из 3');
  });

  test('wait_next: тоже показывает прогресс', async () => {
    const { story } = questionStory({
      type: 'wait_next',
      questionnaireId: 'q-1',
      currentQuestion: {
        questionCode: 'qc1',
        type: 'choice',
        multiple: true,
        question: 'Первый?',
        answers: [{ answer: 'А', answerCode: 'a' }],
      },
      selectedAnswers: ['a'],
      questionIndex: 1,
      poolSize: 3,
    });

    const res = await story.handleCallback('answer:q-1:a', actor, session);

    expect(res.sendMessage?.text).toContain('Вопрос 1 из 3');
  });

  test('первый вопрос (previousQuestion отсутствует) — подсказка /cancel', async () => {
    const { story } = questionStory({
      type: 'new_question',
      questionnaireId: 'q-1',
      question: { questionCode: 'qc1', type: 'text', question: 'Первый?' },
      questionIndex: 1,
      poolSize: 3,
    });

    const res = await story.handleCallback('answer:q-1:yes', actor, session);

    expect(res.sendMessage?.text).toContain('/cancel');
  });

  test('не первый вопрос (previousQuestion есть) — без подсказки', async () => {
    const { story } = questionStory({
      type: 'new_question',
      questionnaireId: 'q-1',
      question: { questionCode: 'qc2', type: 'text', question: 'Второй?' },
      previousQuestion: {
        questionCode: 'qc1',
        type: 'text',
        question: 'Первый?',
      },
      questionIndex: 2,
      poolSize: 3,
    });

    const res = await story.handleCallback('answer:q-1:yes', actor, session);

    expect(res.sendMessage?.text).not.toContain('/cancel');
  });
});
