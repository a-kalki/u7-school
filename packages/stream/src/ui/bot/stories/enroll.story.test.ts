import { describe, expect, mock, test } from 'bun:test';
import type { U7BotApp, User } from '@u7-scl/app/domain';
import type { SessionData } from '@u7-scl/core/ui';
import { assertResponseMarkdownSafe } from '@u7-scl/core/ui';
import { Role } from '@u7-scl/user/domain';
import type { StreamApiModule } from 'packages/stream/src/api';
import { EnrollStory } from './enroll.story';

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

  test('handleCallback("enroll:<id>") — поток без enrollmentKey — сразу зачисляет', async () => {
    const moduleApi = {
      execute: mock(async (name: string) => {
        if (name === 'get-stream') return mockStream;
        if (name === 'enroll-student') return undefined;
        return undefined;
      }),
    } as unknown as StreamApiModule;
    const appApi = {
      execute: mock(() => undefined),
    } as unknown as U7BotApp;

    const story = new EnrollStory();
    story.init(moduleApi, appApi);

    const response = await story.handleCallback('enroll:s1', actor, session);
    assertResponseMarkdownSafe(response);

    expect(response.sendMessage?.text).toContain('записаны');
    expect(response.sendMessage?.text).toContain('Обучение начнётся');
    expect(response.delegate?.path).toBe('learning:my-study');
  });

  // ── enrollmentKey ──

  test('поток с enrollmentKey — запрашивает слово и captureInput', async () => {
    const moduleApi = {
      execute: mock(async (name: string) => {
        if (name === 'get-stream')
          return { ...mockStream, enrollmentKey: 'secret' };
        return undefined;
      }),
    } as unknown as StreamApiModule;
    const appApi = {
      execute: mock(() => undefined),
    } as unknown as U7BotApp;

    const story = new EnrollStory();
    story.init(moduleApi, appApi);

    const response = await story.handleCallback('enroll:s1', actor, session);
    expect(response.sendMessage?.text).toContain('кодовое слово');
    expect(response.captureInput).toBeDefined();
    expect(response.captureInput?.path).toContain('enroll-key');
  });

  test('верное кодовое слово → зачисление с enrollmentKey', async () => {
    const moduleApi = {
      execute: mock(async (name: string) => {
        if (name === 'get-stream')
          return { ...mockStream, enrollmentKey: 'secret' };
        if (name === 'enroll-student') return undefined;
        return undefined;
      }),
    } as unknown as StreamApiModule;
    const appApi = {
      execute: mock(() => undefined),
    } as unknown as U7BotApp;

    const story = new EnrollStory();
    story.init(moduleApi, appApi);

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
    expect(moduleApi.execute).toHaveBeenCalledWith(
      'enroll-student',
      expect.objectContaining({ enrollmentKey: 'secret' }),
      'user-1',
    );
  });

  test('неверное слово — сообщение об оставшихся попытках', async () => {
    const moduleApi = {
      execute: mock(() => undefined),
    } as unknown as StreamApiModule;
    const appApi = {
      execute: mock(() => undefined),
    } as unknown as U7BotApp;

    const story = new EnrollStory();
    story.init(moduleApi, appApi);

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
    const moduleApi = {
      execute: mock(() => undefined),
    } as unknown as StreamApiModule;
    const appApi = {
      execute: mock(() => undefined),
    } as unknown as U7BotApp;

    const story = new EnrollStory();
    story.init(moduleApi, appApi);

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
    const moduleApi = {
      execute: mock(() => undefined),
    } as unknown as StreamApiModule;
    const appApi = {
      execute: mock(() => undefined),
    } as unknown as U7BotApp;

    const story = new EnrollStory();
    story.init(moduleApi, appApi);

    const response = await story.handleCallback('cancel:s1', actor, {
      activeHandler: {
        path: 'enroll/enroll-key',
        context: { streamId: 's1', enrollmentKey: 'secret', attempts: 1 },
      },
    });

    expect(response.releaseInput).toBe(true);
    expect(response.delegate?.path).toContain('view-stream:view');
  });

  test('handleStart возвращает null', async () => {
    const story = new EnrollStory();
    const item = await story.handleStart(actor);
    expect(item).toBeNull();
  });
});
