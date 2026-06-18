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

  const WIZARD_PATH = 'stream/create-stream/wizard';

  // Вспомогательная функция для создания контекста
  function makeCtx(overrides: Record<string, unknown> = {}) {
    return {
      step: 0,
      moduleId: '',
      title: '',
      description: '',
      startDate: '',
      telegramGroupId: '',
      goal: '',
      result: '',
      rules: '',
      targetAudience: '',
      additional: '',
      moduleGoal: '',
      moduleResult: '',
      moduleRules: '',
      moduleTargetAudience: '',
      moduleAdditional: '',
      ...overrides,
    };
  }

  test('handleCallback("start") сразу показывает список модулей с клавиатурой', async () => {
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
          ];
        return undefined;
      }),
    } as unknown as U7BotApp;

    const story = new CreateStreamStory();
    story.init(moduleApi, appApiWithModules);

    const response = await story.handleCallback('start', mentor, {
      activeHandler: null,
    });
    expect(response.captureInput).toBeDefined();
    expect(response.captureInput?.path).toContain('create-stream');
    const ctx = response.captureInput?.context as { step: number } | undefined;
    expect(ctx?.step).toBe(0);
    expect(response.sendMessage?.text).toContain('Выберите модуль');
    expect(response.sendMessage?.keyboard).toBeDefined();
    const btnTexts =
      response.sendMessage?.keyboard?.rows
        .flat()
        .map((b: { text: string }) => b.text) ?? [];
    expect(btnTexts).toContain('Основы JavaScript');
  });

  test('handleMessage: шаг 0 — загружает все опубликованные модули через appApi', async () => {
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

    const response = await story.handleMessage(
      { type: 'message', text: 'любой текст', telegramId: 123 },
      mentor,
      { activeHandler: { path: WIZARD_PATH, context: makeCtx() } },
    );

    expect(appApiWithModules.execute).toHaveBeenCalledWith('list-modules', {
      status: 'published',
    });
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

    const response = await story.handleMessage(
      { type: 'message', text: 'любой текст', telegramId: 123 },
      mentor,
      { activeHandler: { path: WIZARD_PATH, context: makeCtx() } },
    );

    expect(response.sendMessage?.text).toContain('Нет доступных модулей');
    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btnTexts.some((t) => t.includes('Обновить'))).toBe(true);
  });

  test('handleCallback("module:<id>") — предзаполняет title/description из модуля', async () => {
    const moduleApi = {
      execute: mock(() => undefined),
    } as unknown as StreamApiModule;
    const appApiWithModule = {
      execute: mock((name: string, _cmd: Record<string, unknown>) => {
        if (name === 'get-module')
          return {
            uuid: 'mod-1',
            title: 'Основы JavaScript',
            description: 'Базовый курс по JS',
            goal: 'Научиться программировать',
            result: 'Создадите проект',
            rules: 'Без списывания',
            targetAudience: 'Новички',
            additional: '',
          };
        return undefined;
      }),
    } as unknown as U7BotApp;

    const story = new CreateStreamStory();
    story.init(moduleApi, appApiWithModule);

    const response = await story.handleCallback('module:mod1', mentor, {
      activeHandler: { path: WIZARD_PATH, context: makeCtx() },
    });

    const newCtx = response.captureInput?.context as Record<string, unknown>;
    expect(newCtx?.moduleId).toBe('mod1');
    expect(newCtx?.step).toBe(1);
    // title и description предзаполнены
    expect(newCtx?.title).toBe('Основы JavaScript');
    expect(newCtx?.description).toBe('Базовый курс по JS');
    // module-поля сохранены в контексте
    expect(newCtx?.moduleGoal).toBe('Научиться программировать');
    expect(newCtx?.moduleResult).toBe('Создадите проект');
    expect(newCtx?.moduleRules).toBe('Без списывания');
    expect(newCtx?.moduleTargetAudience).toBe('Новички');
    // Сообщение с подсказкой
    expect(response.sendMessage?.text).toContain('Основы JavaScript');
    expect(response.sendMessage?.text).toContain('По умолчанию');
  });

  test('шаг необязательного поля — если есть значение модуля, кнопки «Принять»/«Пропустить»', async () => {
    const story = new CreateStreamStory();

    // Шаг 4: goal, есть moduleGoal
    const response = await story.handleMessage(
      { type: 'message', text: '2026-07-01', telegramId: 123 },
      mentor,
      {
        activeHandler: {
          path: WIZARD_PATH,
          context: makeCtx({
            step: 3,
            moduleId: 'mod-1',
            title: 'Поток',
            description: 'Описание',
            moduleGoal: 'Цель из модуля',
          }),
        },
      },
    );

    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('Цель из модуля');
    expect(text).toContain('По умолчанию');

    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btnTexts.some((t) => t.includes('Принять'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Пропустить'))).toBe(true);
  });

  test('шаг необязательного поля — если нет значения модуля, просто поле ввода с «Пропустить»', async () => {
    const story = new CreateStreamStory();

    // Шаг 4: goal, moduleGoal пустой
    const response = await story.handleMessage(
      { type: 'message', text: '2026-07-01', telegramId: 123 },
      mentor,
      {
        activeHandler: {
          path: WIZARD_PATH,
          context: makeCtx({
            step: 3,
            moduleId: 'mod-1',
            title: 'Поток',
            description: 'Описание',
            moduleGoal: '',
          }),
        },
      },
    );

    const text = response.sendMessage?.text ?? '';
    expect(text).not.toContain('По умолчанию');

    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btnTexts.some((t) => t.includes('Пропустить'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Принять'))).toBe(false);
  });

  test('кнопка «Принять» подставляет значение модуля и переходит к следующему шагу', async () => {
    const story = new CreateStreamStory();

    const response = await story.handleCallback('accept-goal', mentor, {
      activeHandler: {
        path: WIZARD_PATH,
        context: makeCtx({
          step: 4,
          moduleGoal: 'Цель из модуля',
          title: 'Поток',
          description: 'Описание',
          moduleId: 'mod-1',
        }),
      },
    });

    const newCtx = response.captureInput?.context as Record<string, unknown>;
    expect(newCtx?.goal).toBe('Цель из модуля');
    expect(newCtx?.step).toBe(5);
  });

  test('кнопка «Пропустить» оставляет поле пустым и переходит к следующему шагу', async () => {
    const story = new CreateStreamStory();

    const response = await story.handleCallback('skip-goal', mentor, {
      activeHandler: {
        path: WIZARD_PATH,
        context: makeCtx({
          step: 4,
          moduleGoal: 'Цель из модуля',
          title: 'Поток',
          description: 'Описание',
          moduleId: 'mod-1',
        }),
      },
    });

    const newCtx = response.captureInput?.context as Record<string, unknown>;
    expect(newCtx?.goal).toBe('');
    expect(newCtx?.step).toBe(5);
  });

  test('можно ввести своё значение для необязательного поля', async () => {
    const story = new CreateStreamStory();

    const response = await story.handleMessage(
      { type: 'message', text: 'Моя собственная цель', telegramId: 123 },
      mentor,
      {
        activeHandler: {
          path: WIZARD_PATH,
          context: makeCtx({
            step: 4,
            moduleGoal: 'Цель из модуля',
            title: 'Поток',
            description: 'Описание',
            moduleId: 'mod-1',
          }),
        },
      },
    );

    const newCtx = response.captureInput?.context as Record<string, unknown>;
    expect(newCtx?.goal).toBe('Моя собственная цель');
    expect(newCtx?.step).toBe(5);
  });

  test('все необязательные поля передаются в create-stream', async () => {
    const moduleApi = {
      execute: mock((name: string) => {
        if (name === 'create-stream')
          return { uuid: 'new-stream', title: 'Мой поток' };
        return undefined;
      }),
    } as unknown as StreamApiModule;

    const story = new CreateStreamStory();
    story.init(moduleApi, emptyAppApi);

    const response = await story.handleCallback('confirm', mentor, {
      activeHandler: {
        path: WIZARD_PATH,
        context: makeCtx({
          step: 10,
          moduleId: 'mod-1',
          title: 'Мой поток',
          description: 'Описание',
          startDate: '2026-07-01',
          telegramGroupId: '@group',
          goal: 'Цель',
          result: 'Результат',
          rules: 'Правила',
          targetAudience: 'Для всех',
          additional: 'Дополнительно',
        }),
      },
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
        goal: 'Цель',
        result: 'Результат',
        rules: 'Правила',
        targetAudience: 'Для всех',
        additional: 'Дополнительно',
      },
      'mentor-1',
    );
    expect(response.releaseInput).toBe(true);
  });

  test('ошибка валидации create-stream — сообщение и сброс', async () => {
    const moduleApi = {
      execute: mock((name: string) => {
        if (name === 'create-stream')
          throw Object.assign(new Error('Валидация'), {
            details: [
              { field: 'title', message: 'Название не может быть пустым' },
            ],
          });
        return undefined;
      }),
    } as unknown as StreamApiModule;

    const story = new CreateStreamStory();
    story.init(moduleApi, emptyAppApi);

    const response = await story.handleCallback('confirm', mentor, {
      activeHandler: {
        path: WIZARD_PATH,
        context: makeCtx({
          step: 10,
          moduleId: 'mod-1',
          title: '',
          description: 'Описание',
          startDate: '2026-07-01',
        }),
      },
    });

    expect(moduleApi.execute).toHaveBeenCalled();
    expect(response.releaseInput).toBe(true);
    expect(response.sendMessage?.text).toContain('Ошибка валидации');
  });

  test('handleStart — MENTOR видит кнопку «Создать поток»', async () => {
    const story = new CreateStreamStory();
    const item = await story.handleStart(mentor);
    expect(item?.text).toContain('Создать поток');
    expect(item?.priority).toBe(30);
  });

  test('handleStart — GUEST не видит кнопку', async () => {
    const story = new CreateStreamStory();
    const item = await story.handleStart(guest);
    expect(item).toBeNull();
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
