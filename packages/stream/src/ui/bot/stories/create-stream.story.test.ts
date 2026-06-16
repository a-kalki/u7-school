import { describe, expect, mock, test } from 'bun:test';
import type { U7BotApp, User } from '@u7-scl/app/domain';
import { Role } from '@u7-scl/user/domain';
import type { StreamApiModule } from 'packages/stream/src/api';
import { CreateStreamStory } from './create-stream.story';

describe('CreateStreamStory', () => {
  const mentor: User = {
    uuid: 'mentor-1',
    name: 'Ментор',
    telegramId: 123,
    roles: [Role.MENTOR],
    createdAt: '2026-01-01T00:00:00.000Z',
  };
  const guest: User = {
    uuid: 'user-1',
    name: 'Гость',
    telegramId: 456,
    roles: [Role.GUEST],
    createdAt: '2026-01-01T00:00:00.000Z',
  };
  const emptyAppApi = {
    execute: mock(() => undefined),
  } as unknown as U7BotApp;

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

  test('handleMessage: шаг 0 — загружает все опубликованные модули через appApi и показывает inline-кнопки', async () => {
    const moduleApi = {
      execute: mock(() => undefined),
    } as unknown as StreamApiModule;
    const appApiWithModules = {
      execute: mock((name: string, _cmd: Record<string, unknown>) => {
        if (name === 'list-modules')
          return [
            {
              uuid: 'mod-1',
              title: 'Основы JavaScript',
              description: '',
              authorId: 'mentor-1',
              status: 'published',
              projects: [],
              createdAt: '2026-01-01T00:00:00.000Z',
            },
            {
              uuid: 'mod-2',
              title: 'Продвинутый Python',
              description: '',
              authorId: 'mentor-1',
              status: 'published',
              projects: [],
              createdAt: '2026-01-01T00:00:00.000Z',
            },
          ];
        return undefined;
      }),
    } as unknown as U7BotApp;

    const story = new CreateStreamStory();
    story.init(moduleApi, appApiWithModules);

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

    expect(appApiWithModules.execute).toHaveBeenCalledWith('list-modules', {
      status: 'published',
    });
    expect(response.sendMessage?.keyboard).toBeDefined();
    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btnTexts).toContain('Основы JavaScript');
    expect(btnTexts).toContain('Продвинутый Python');
  });

  test('handleMessage: шаг 0 — если модулей нет, показывает сообщение и кнопку обновить', async () => {
    const moduleApi = {
      execute: mock(() => undefined),
    } as unknown as StreamApiModule;
    const appApiEmpty = {
      execute: mock(() => []),
    } as unknown as U7BotApp;

    const story = new CreateStreamStory();
    story.init(moduleApi, appApiEmpty);

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

    expect(response.sendMessage?.text).toContain('Нет доступных модулей');
    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btnTexts.some((t) => t.includes('Обновить'))).toBe(true);
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

  test('handleMessage: шаг 4 (группа) — показывает превью с кнопками «Создать» и «Изменить»', async () => {
    const moduleApi = {
      execute: mock(() => undefined),
    } as unknown as StreamApiModule;

    const story = new CreateStreamStory();
    story.init(moduleApi, emptyAppApi);

    const ctx = {
      step: 4,
      moduleId: 'mod-1',
      title: 'Мой поток',
      description: 'Описание потока',
      startDate: '2026-07-01',
      telegramGroupId: '',
    };

    const response = await story.handleMessage(
      { type: 'message', text: '@mygroup', telegramId: 123 },
      mentor,
      { activeHandler: { path: 'stream/create-stream/wizard', context: ctx } },
    );

    expect(response.sendMessage?.text).toContain('Мой поток');
    expect(response.sendMessage?.text).toContain('Описание потока');
    expect(response.sendMessage?.text).toContain('2026\\-07\\-01');
    expect(response.sendMessage?.text).toContain('@mygroup');

    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btnTexts.some((t) => t.includes('Создать'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Изменить'))).toBe(true);
  });

  test('handleCallback("confirm"): нажатие «Создать» вызывает create-stream и освобождает input', async () => {
    const moduleApi = {
      execute: mock((name: string) => {
        if (name === 'create-stream')
          return { uuid: 'new-stream', title: 'Мой поток' };
        return undefined;
      }),
    } as unknown as StreamApiModule;

    const story = new CreateStreamStory();
    story.init(moduleApi, emptyAppApi);

    const ctx = {
      step: 5,
      moduleId: 'mod-1',
      title: 'Мой поток',
      description: 'Описание',
      startDate: '2026-07-01',
      telegramGroupId: '@group',
    };

    const response = await story.handleCallback('confirm', mentor, {
      activeHandler: { path: 'stream/create-stream/wizard', context: ctx },
    });

    expect(moduleApi.execute).toHaveBeenCalledWith(
      'create-stream',
      {
        title: 'Мой поток',
        description: 'Описание',
        moduleId: 'mod-1',
        startDate: '2026-07-01',
        telegramGroupId: '@group',
        mentorId: 'mentor-1',
      },
      'mentor-1',
    );
    expect(response.releaseInput).toBe(true);
    expect(response.sendMessage?.text).toContain('успешно создан');
  });

  test('handleCallback("confirm"): без контекста — ошибка', async () => {
    const moduleApi = {
      execute: mock(() => undefined),
    } as unknown as StreamApiModule;

    const story = new CreateStreamStory();
    story.init(moduleApi, emptyAppApi);

    const response = await story.handleCallback('confirm', mentor, {
      activeHandler: null,
    });

    expect(response.sendMessage?.text).toContain('Контекст');
  });
});
