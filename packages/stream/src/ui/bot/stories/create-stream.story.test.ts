import { describe, expect, mock, test } from 'bun:test';
import type { SessionData } from '@u7-scl/core/ui';
import type { User } from '@u7-scl/app/domain';
import { CreateStreamStory } from './create-stream.story';

describe('CreateStreamStory', () => {
  const mentor: User = {
    uuid: 'mentor-1',
    name: 'Ментор',
    telegramId: 123,
    roles: ['MENTOR'],
    createdAt: '2026-01-01T00:00:00.000Z',
  };
  const guest: User = {
    uuid: 'user-1',
    name: 'Гость',
    telegramId: 456,
    roles: ['GUEST'],
    createdAt: '2026-01-01T00:00:00.000Z',
  };
  const appApi = { execute: mock(() => undefined) };

  test('handleCallback("start") начинает wizard с captureInput', async () => {
    const story = new CreateStreamStory();
    const response = await story.handleCallback('start', mentor, {
      activeHandler: null,
    });
    expect(response.captureInput).toBeDefined();
    expect(response.captureInput?.path).toContain('create-stream');
    const ctx = response.captureInput?.context as { step: number } | undefined;
    expect(ctx?.step).toBe(0);
  });

  test('handleMessage: шаг 1 — выбор модуля (мок)', async () => {
    const moduleApi = {
      execute: mock((_name: string) => [{ uuid: 'mod1', title: 'Модуль 1' }]),
    };

    const story = new CreateStreamStory();
    story.init(moduleApi as any, appApi as any);

    const ctx = {
      step: 0,
      moduleId: '',
      title: '',
      description: '',
      startDate: '',
      telegramGroupId: '',
    };

    const response = await story.handleMessage(
      { type: 'message', text: 'любой текст', telegramId: 123 },
      mentor,
      { activeHandler: { path: 'stream/create-stream/wizard', context: ctx } },
    );

    expect(response.sendMessage?.keyboard).toBeDefined();
  });

  test('handleCallback("module:<id>") выбирает модуль и переходит к шагу 2', async () => {
    const story = new CreateStreamStory();
    const ctx = {
      step: 0,
      moduleId: '',
      title: '',
      description: '',
      startDate: '',
      telegramGroupId: '',
    };

    const response = await story.handleCallback('module:mod1', mentor, {
      activeHandler: { path: 'stream/create-stream/wizard', context: ctx },
    });

    expect(response.captureInput).toBeDefined();
    const newCtx = response.captureInput?.context as {
      step: number;
      moduleId: string;
    };
    expect(newCtx?.step).toBe(1);
    expect(newCtx?.moduleId).toBe('mod1');
  });

  test('handleStart — MENTOR видит кнопку «Панель ментора»', async () => {
    const story = new CreateStreamStory();
    const item = await story.handleStart(mentor);
    expect(item?.text).toContain('Панель ментора');
    expect(item?.priority).toBe(30);
  });

  test('handleStart — GUEST не видит кнопку', async () => {
    const story = new CreateStreamStory();
    const item = await story.handleStart(guest);
    expect(item).toBeNull();
  });
});
