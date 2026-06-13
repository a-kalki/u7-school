import { describe, expect, mock, test } from 'bun:test';
import type { ApiApp } from '@u7-scl/core/api';
import type { SessionData } from '@u7-scl/core/ui';
import type { StreamAppMeta } from '../../../domain/module';
import { CreateStreamStory } from './create-stream.story';

describe('CreateStreamStory', () => {
  const mentor = { uuid: 'mentor-1', roles: ['MENTOR'] };
  const guest = { uuid: 'user-1', roles: ['GUEST'] };

  test('handleCallback("start") начинает wizard с captureInput', async () => {
    const story = new CreateStreamStory();
    const response = await story.handleCallback('start', mentor, {
      activeHandler: null,
    });
    expect(response.captureInput).toBeDefined();
    expect(response.captureInput?.path).toContain('create-stream');
    // Контекст должен начинаться с шага 0
    const ctx = response.captureInput?.context as { step: number } | undefined;
    expect(ctx?.step).toBe(0);
  });

  test('handleMessage: шаг 1 — выбор модуля (мок)', async () => {
    const mockApi = {
      execute: mock((_name: string) => [{ uuid: 'mod1', title: 'Модуль 1' }]),
    } as unknown as ApiApp<StreamAppMeta>;

    const story = new CreateStreamStory();
    story.init(mockApi);

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

    // Должен предложить выбрать модуль (кнопки)
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
