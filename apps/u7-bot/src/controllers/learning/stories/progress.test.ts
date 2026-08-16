import { describe, expect, mock, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import type { SessionData } from '@u7-scl/core/ui';
import { assertResponseMarkdownSafe } from '@u7-scl/core/ui';
import { Role } from '@u7-scl/user/domain';
import { ProgressStory } from './progress';

describe('ProgressStory', () => {
  const studentActor: User = {
    uuid: 'user-1',
    name: 'Студент',
    telegramId: 123,
    roles: [Role.STUDENT],
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  const session: SessionData = { activeHandler: null };
  const STREAM_ID = '11111111-1111-1111-1111-111111111111';
  const STEP1_ID = '22222222-2222-2222-2222-222222222222';
  const STEP2_ID = '33333333-3333-3333-3333-333333333333';

  const mockStudent = {
    uuid: 'student-uuid',
    streamId: STREAM_ID,
    userId: 'user-1',
    status: 'active',
    currentStepId: STEP1_ID,
    steps: [
      { stepId: STEP1_ID, status: 'completed' },
      { stepId: STEP2_ID, status: 'completed' },
    ],
  };

  const mockStream = {
    uuid: STREAM_ID,
    title: 'Python Basic',
    description: 'Курс',
    status: 'active',
    startDate: '2026-06-01T00:00:00.000Z',
    contentSnapshot: [
      {
        projectId: 'proj-1',
        projectTitle: 'Основы',
        lessons: [
          {
            lessonId: 'lesson-1',
            lessonTitle: 'Введение',
            stepIds: [STEP1_ID, STEP2_ID],
          },
        ],
      },
    ],
  };

  function makeStory(appApiOverrides?: Record<string, unknown>) {
    const appApiSpy = mock((name: string, ..._args: unknown[]) => {
      if (appApiOverrides && name in appApiOverrides) {
        const val = appApiOverrides[name];
        if (typeof val === 'function') return (val as () => unknown)();
        if (val instanceof Error) throw val;
        return val;
      }
      if (name === 'get-student-by-user') return mockStudent;
      if (name === 'get-stream') return mockStream;
      return undefined;
    });

    const mockUiApp = {
      getAction: mock(() => {
        throw new Error('not found');
      }),
      getController: mock(() => undefined),
    };

    const story = new ProgressStory();
    story.init({ appApi: { execute: appApiSpy }, uiApp: mockUiApp } as never);
    return { story, appApiSpy };
  }

  test('progress:{streamId} — показывает общий прогресс', async () => {
    const { story } = makeStory();

    const response = await story.handleCallback(
      `progress:${STREAM_ID}`,
      studentActor,
      session,
    );
    assertResponseMarkdownSafe(response);

    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('Мой прогресс');
    expect(text).toContain('Python Basic');
    expect(text).toContain('Общий:');
    expect(text).toContain('Основы');
    expect(text).toContain('Всего шагов завершено');
  });

  test('progress:{streamId} — показывает прогресс по проектам и урокам', async () => {
    const { story } = makeStory();

    const response = await story.handleCallback(
      `progress:${STREAM_ID}`,
      studentActor,
      session,
    );

    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('Проект 1:');
    expect(text).toContain('Введение');
  });

  test('progress:{streamId} — несовпадение streamId → ошибка', async () => {
    const { story } = makeStory();

    const response = await story.handleCallback(
      'progress:wrong-stream',
      studentActor,
      session,
    );

    expect(response.sendMessage?.text).toContain('не соответствует');
  });

  test('студент не записан → ошибка', async () => {
    const { story } = makeStory({
      'get-student-by-user': (() => {
        throw new Error('not found');
      }) as unknown,
    });

    const response = await story.handleCallback(
      `progress:${STREAM_ID}`,
      studentActor,
      session,
    );

    expect(response.sendMessage?.text).toContain('не записаны');
  });

  test('неизвестная команда', async () => {
    const { story } = makeStory();

    const response = await story.handleCallback(
      'unknown',
      studentActor,
      session,
    );
    expect(response.sendMessage?.text).toContain('Неизвестная');
  });

  test('handleMessage возвращает заглушку', async () => {
    const { story } = makeStory();
    const response = await story.handleMessage(
      { type: 'message', text: 'test', telegramId: 123 },
      studentActor,
      session,
    );
    expect(response.sendMessage?.text).toContain('Неизвестное');
  });
});
