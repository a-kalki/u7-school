import { describe, expect, mock, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import type { SessionData } from '@u7-scl/core/ui';
import { assertResponseMarkdownSafe } from '@u7-scl/core/ui';
import { Role } from '@u7-scl/user/domain';
import { HubStory } from './hub';

describe('HubStory', () => {
  const session: SessionData = { activeHandler: null };

  const studentActor: User = {
    uuid: 'user-1',
    name: 'Студент',
    telegramId: 123,
    roles: [Role.STUDENT],
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  const guestActor: User = {
    uuid: 'user-2',
    name: 'Гость',
    telegramId: 456,
    roles: [Role.GUEST],
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  const STREAM_ID = '11111111-1111-1111-1111-111111111111';

  const mockStudent = {
    uuid: 'student-uuid',
    streamId: STREAM_ID,
    userId: 'user-1',
    status: 'active',
    currentStepId: 'step-1',
    steps: [{ stepId: 'step-1', status: 'completed' }],
  };

  function makeStory(appApiOverrides?: Record<string, unknown>) {
    const mockAppApi = {
      execute: mock((name: string) => {
        if (appApiOverrides && name in appApiOverrides)
          return appApiOverrides[name];
        if (name === 'get-student-by-user') return mockStudent;
        return undefined;
      }),
    };

    const mockUiApp = {
      getAction: mock((name: string) => {
        if (name === 'mainMenu') {
          return () => ({ text: '↩️ Главное меню', code: 'app:main-menu' });
        }
        throw new Error(`Действие «${name}» не найдено`);
      }),
      getController: mock(() => undefined),
    };

    const story = new HubStory();
    story.init({ appApi: mockAppApi, uiApp: mockUiApp } as never);
    return { story, mockAppApi };
  }

  test('handleCallback("my-study") показывает хаб с кнопками', async () => {
    const { story } = makeStory();

    const response = await story.handleCallback(
      'my-study',
      studentActor,
      session,
    );
    assertResponseMarkdownSafe(response);

    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('Моя учёба');

    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btnTexts.some((t) => t.includes('Продолжить учёбу'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Уроки'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Мой прогресс'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Покинуть поток'))).toBe(true);
  });

  test('handleCallback("my-study") — студент не записан', async () => {
    const { story } = makeStory({
      'get-student-by-user': undefined,
    });
    // Переопределяем execute чтобы бросал ошибку
    const errorStory = new HubStory();
    const errorAppApi = {
      execute: mock(() => {
        throw new Error('not found');
      }),
    };
    const mockUiApp = {
      getAction: mock(() => {
        throw new Error('not found');
      }),
      getController: mock(() => undefined),
    };
    errorStory.init({ appApi: errorAppApi, uiApp: mockUiApp } as never);

    const response = await errorStory.handleCallback(
      'my-study',
      studentActor,
      session,
    );
    assertResponseMarkdownSafe(response);

    expect(response.sendMessage?.text).toContain('не записаны');
  });

  test('handleCallback("my-study") — завершивший студент (без Продолжить и Уроки)', async () => {
    const { story } = makeStory({
      'get-student-by-user': { ...mockStudent, status: 'advanced' },
    });

    const response = await story.handleCallback(
      'my-study',
      studentActor,
      session,
    );

    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btnTexts.some((t) => t.includes('Продолжить'))).toBe(false);
    expect(btnTexts.some((t) => t.includes('Уроки'))).toBe(false);
    expect(btnTexts.some((t) => t.includes('Покинуть поток'))).toBe(true);
  });

  test('handleCallback("my-study:leave-confirm") показывает confirm-диалог', async () => {
    const { story } = makeStory();

    const response = await story.handleCallback(
      'my-study:leave-confirm',
      studentActor,
      session,
    );

    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('уверены');

    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btnTexts.some((t) => t.includes('Да'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Отмена'))).toBe(true);
  });

  test('handleCallback("my-study:leave") вызывает drop-student', async () => {
    const executeSpy = mock((_name: string, ..._args: unknown[]) => {
      if (_name === 'get-student-by-user') return mockStudent;
      if (_name === 'drop-student') return undefined;
      return undefined;
    });

    const mockUiApp = {
      getAction: mock(() => {
        throw new Error('not found');
      }),
      getController: mock(() => undefined),
    };

    const story = new HubStory();
    story.init({ appApi: { execute: executeSpy }, uiApp: mockUiApp } as never);

    const response = await story.handleCallback(
      'my-study:leave',
      studentActor,
      session,
    );

    const dropCalls = executeSpy.mock.calls.filter(
      (c: unknown[]) => c[0] === 'drop-student',
    );
    expect(dropCalls.length).toBe(1);
    expect(dropCalls[0]![1]).toEqual({
      streamId: STREAM_ID,
      studentId: mockStudent.uuid,
    });

    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('поток');
  });

  test('handleCallback("my-study:leave") при ошибке — handleError', async () => {
    const executeSpy = mock((_name: string, ..._args: unknown[]) => {
      if (_name === 'get-student-by-user') return mockStudent;
      if (_name === 'drop-student') throw new Error('drop failed');
      return undefined;
    });

    const mockUiApp = {
      getAction: mock(() => {
        throw new Error('not found');
      }),
      getController: mock(() => undefined),
    };

    const story = new HubStory();
    story.init({ appApi: { execute: executeSpy }, uiApp: mockUiApp } as never);

    const response = await story.handleCallback(
      'my-study:leave',
      studentActor,
      session,
    );

    // handleError должен вернуть сообщение об ошибке
    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('⚠️');
  });

  test('handleStart — STUDENT видит кнопку «Моя учёба»', async () => {
    const { story } = makeStory();
    const item = await story.handleStart(studentActor);
    expect(item?.text).toContain('Моя учёба');
    expect(item?.priority).toBe(20);
  });

  test('handleStart — GUEST не видит кнопку', async () => {
    const { story } = makeStory();
    const item = await story.handleStart(guestActor);
    expect(item).toBeNull();
  });

  test('handleStart — описание содержит «Моя учёба»', async () => {
    const { story } = makeStory();
    const item = await story.handleStart(studentActor);
    expect(item?.description).toContain('Моя учёба');
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
