import { describe, expect, mock, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import type { SessionData } from '@u7-scl/core/ui';
import { assertResponseMarkdownSafe } from '@u7-scl/core/ui';
import { Role } from '@u7-scl/user/domain';
import { EnrollStory } from './enroll';

describe('EnrollStory', () => {
  const actor: User = {
    uuid: 'user-1',
    name: 'Гость',
    telegramId: 123,
    roles: [Role.GUEST],
    createdAt: '2026-01-01T00:00:00.000Z',
  };
  const session: SessionData = { activeHandler: null };

  const mockStream = {
    uuid: 's1',
    title: 'Поток',
    description: '',
    status: 'enrollment',
    startDate: '2026-07-01T00:00:00.000Z',
  };

  /** Создаёт EnrollStory с замоканными appApi и uiApp. */
  function makeStory(appApiOverrides?: Record<string, unknown>) {
    const appApiSpy = mock((name: string, ..._args: unknown[]) => {
      if (appApiOverrides && name in appApiOverrides) {
        const val = appApiOverrides[name];
        if (typeof val === 'function') return val();
        return val;
      }
      if (name === 'get-stream') return mockStream;
      if (name === 'enroll-student') return undefined;
      return undefined;
    });

    const mockUiApp = {
      getAction: mock(() => {
        throw new Error('not found');
      }),
      getController: mock(() => undefined),
    };

    const story = new EnrollStory();
    story.init({ execute: appApiSpy } as never, mockUiApp as never);
    return { story, appApiSpy, mockUiApp };
  }

  test('handleCallback("enroll:<id>") — поток без enrollmentKey — сразу зачисляет', async () => {
    const { story } = makeStory();

    const response = await story.handleCallback('enroll:s1', actor, session);
    assertResponseMarkdownSafe(response);

    expect(response.sendMessage?.text).toContain('записаны');
    expect(response.sendMessage?.text).toContain('Обучение начнётся');
    expect(response.delegate?.path).toBe('hub:my-study');
  });

  // ── enrollmentKey ──

  test('поток с enrollmentKey — запрашивает слово и captureInput', async () => {
    const { story } = makeStory({
      'get-stream': { ...mockStream, enrollmentKey: 'secret' },
    });

    const response = await story.handleCallback('enroll:s1', actor, session);
    expect(response.sendMessage?.text).toContain('кодовое слово');
    expect(response.captureInput).toBeDefined();
    expect(response.captureInput?.path).toContain('enroll-key');
  });

  test('верное кодовое слово → зачисление с enrollmentKey', async () => {
    const { story, appApiSpy } = makeStory({
      'get-stream': { ...mockStream, enrollmentKey: 'secret' },
      'enroll-student': undefined,
    });

    const response = await story.handleMessage(
      { type: 'message', text: 'secret', telegramId: 123 },
      actor,
      {
        activeHandler: {
          path: 'enroll/enroll-key',
          context: { streamId: 's1', enrollmentKey: 'secret', attempts: 0 },
        },
      },
    );
    assertResponseMarkdownSafe(response);

    expect(response.sendMessage?.text).toContain('записаны');

    // Проверяем, что enroll-student был вызван с enrollmentKey
    const enrollCalls = appApiSpy.mock.calls.filter(
      (c: unknown[]) => c[0] === 'enroll-student',
    );
    expect(enrollCalls.length).toBeGreaterThanOrEqual(1);
    expect(enrollCalls[0]![1]).toMatchObject({
      enrollmentKey: 'secret',
      streamId: 's1',
      userId: 'user-1',
    });
  });

  test('неверное слово — сообщение об оставшихся попытках', async () => {
    const { story } = makeStory();

    const response = await story.handleMessage(
      { type: 'message', text: 'wrong', telegramId: 123 },
      actor,
      {
        activeHandler: {
          path: 'enroll/enroll-key',
          context: { streamId: 's1', enrollmentKey: 'secret', attempts: 0 },
        },
      },
    );

    expect(response.sendMessage?.text).toContain('Неверное');
    expect(response.sendMessage?.text).toContain('2'); // 3 - 1 = 2 осталось
  });

  test('3 неверных попытки → возврат к карточке потока', async () => {
    const { story } = makeStory();

    const response = await story.handleMessage(
      { type: 'message', text: 'wrong3', telegramId: 123 },
      actor,
      {
        activeHandler: {
          path: 'enroll/enroll-key',
          context: { streamId: 's1', enrollmentKey: 'secret', attempts: 2 },
        },
      },
    );

    expect(response.sendMessage?.text).toContain('исчерпаны');
    expect(response.releaseInput).toBe(true);
  });

  test('кнопка «Отмена» → возврат к карточке потока', async () => {
    const { story } = makeStory();

    const response = await story.handleCallback('cancel:s1', actor, {
      activeHandler: {
        path: 'enroll/enroll-key',
        context: { streamId: 's1', enrollmentKey: 'secret', attempts: 1 },
      },
    });

    expect(response.releaseInput).toBe(true);
    expect(response.delegate?.path).toContain('view-stream:view');
  });

  test('handleStart возвращает null (нет кнопки в главном меню)', async () => {
    const { story } = makeStory();
    const item = await story.handleStart(actor);
    expect(item).toBeNull();
  });
});
