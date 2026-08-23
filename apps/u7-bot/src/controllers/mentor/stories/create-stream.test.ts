import { describe, expect, mock, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import type { SessionData } from '@u7-scl/core/ui';
import { assertResponseMarkdownSafe } from '@u7-scl/core/ui';
import { Role } from '@u7-scl/user/domain';
import { CreateStreamStory } from './create-stream';

/** Пустая сессия без контекста */
const NO_SESSION: SessionData = { activeHandler: null };

/** Сессия с captureInput и контекстом wizard'а */
function wizardSession(
  overrides: Partial<{
    step: number;
    moduleId: string;
    title: string;
    description: string;
    startDate: string;
    telegramGroupId: string;
    goal: string;
    result: string;
    rules: string;
    targetAudience: string;
    additional: string;
    enrollmentKey: string;
    moduleGoal: string;
    moduleResult: string;
    moduleRules: string;
    moduleTargetAudience: string;
    moduleAdditional: string;
  }> = {},
): SessionData {
  return {
    activeHandler: {
      path: 'create-stream/wizard',
      context: {
        step: overrides.step ?? 0,
        moduleId: overrides.moduleId ?? '',
        title: overrides.title ?? '',
        description: overrides.description ?? '',
        startDate: overrides.startDate ?? '',
        telegramGroupId: overrides.telegramGroupId ?? '',
        goal: overrides.goal ?? '',
        result: overrides.result ?? '',
        rules: overrides.rules ?? '',
        targetAudience: overrides.targetAudience ?? '',
        additional: overrides.additional ?? '',
        enrollmentKey: overrides.enrollmentKey ?? '',
        moduleGoal: overrides.moduleGoal ?? '',
        moduleResult: overrides.moduleResult ?? '',
        moduleRules: overrides.moduleRules ?? '',
        moduleTargetAudience: overrides.moduleTargetAudience ?? '',
        moduleAdditional: overrides.moduleAdditional ?? '',
      },
      expiresAt: Date.now() + 600_000,
    },
  };
}

const mentorActor: User = {
  uuid: 'mentor-1',
  name: 'Ментор Тест',
  telegramId: 123,
  roles: [Role.MENTOR],
  createdAt: '2026-01-01T00:00:00.000Z',
};

/** Тестовый модуль (опубликованный) */
const mockModule = {
  uuid: 'mod-1',
  title: 'JavaScript Основы',
  description: 'Курс по основам JS',
  goal: 'Научиться писать код',
  result: 'Выпускной проект',
  rules: 'Дедлайны раз в неделю',
  targetAudience: 'Новички в IT',
  additional: 'Нужен компьютер',
  status: 'published',
};

/** Мокнутый appApi для unit-тестов */
function mockAppApi(overrides?: Record<string, unknown>) {
  return {
    execute: mock((name: string, params?: Record<string, unknown>) => {
      if (overrides && name in overrides) {
        const val = overrides[name];
        if (typeof val === 'function') return (val as () => unknown)();
        if (val instanceof Error) throw val;
        return val;
      }
      if (name === 'list-modules') {
        return [mockModule];
      }
      if (name === 'get-module') {
        const uuid = (params as { uuid: string })?.uuid;
        if (uuid === mockModule.uuid) return mockModule;
        return { title: '', description: '' };
      }
      if (name === 'create-stream') {
        return undefined;
      }
      return undefined;
    }),
  };
}

function mockUiApp() {
  return {
    getAction: <T>(_name: string) => {
      return (() => ({
        text: '↩️ Главное меню',
        code: 'app:main-menu',
      })) as unknown as T;
    },
  };
}

function createStory(apiOverrides?: Record<string, unknown>) {
  const story = new CreateStreamStory();
  const api = mockAppApi(apiOverrides);
  const ui = mockUiApp();
  story.init(api as never, ui as never);
  return { story, api };
}

describe('CreateStreamStory', () => {
  // ── handleStart ──

  test('handleStart возвращает null (кнопка только через подменю)', async () => {
    const { story } = createStory();
    const item = await story.handleStart(mentorActor);
    expect(item).toBeNull();
  });

  // ── Шаг 0: выбор модуля ──

  test('handleCallback "start" — показывает список модулей', async () => {
    const { story } = createStory();

    const response = await story.handleCallback(
      'start',
      mentorActor,
      NO_SESSION,
    );
    assertResponseMarkdownSafe(response);

    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('Выберите модуль');
    expect(
      response.sendMessage?.keyboard?.rows
        .flat()
        .some((b) => b.text.includes('JavaScript Основы')),
    ).toBe(true);
    // Должен быть captureInput с контекстом
    expect(response.captureInput).toBeDefined();
    expect(response.captureInput!.context).toBeDefined();
  });

  test('handleCallback "start" — нет модулей', async () => {
    const { story } = createStory({
      'list-modules': [],
    });

    const response = await story.handleCallback(
      'start',
      mentorActor,
      NO_SESSION,
    );
    assertResponseMarkdownSafe(response);

    expect(response.sendMessage?.text).toContain('Нет доступных модулей');
    expect(response.captureInput).toBeDefined();
  });

  // ── Шаг 1: выбор модуля → название потока ──

  test('handleCallback "module:{id}" — переход к шагу 1 (название)', async () => {
    const { story } = createStory();

    const response = await story.handleCallback(
      'module:mod-1',
      mentorActor,
      NO_SESSION,
    );

    expect(response.sendMessage?.text).toContain('название потока');
    expect(response.sendMessage?.text).toContain('JavaScript Основы');
    expect(response.captureInput).toBeDefined();
    const ctx = response.captureInput!.context as Record<string, unknown>;
    expect(ctx.step).toBe(1);
    expect(ctx.moduleId).toBe('mod-1');
    expect(ctx.title).toBe('JavaScript Основы');
  });

  test('handleCallback "accept-title" — принять название → шаг 2 (описание)', async () => {
    const { story } = createStory();

    const session = wizardSession({
      step: 1,
      moduleId: 'mod-1',
      title: 'JS Basics',
      description: 'Описание',
      moduleGoal: 'Цель',
      moduleResult: 'Результат',
      moduleRules: 'Правила',
      moduleTargetAudience: 'Аудитория',
      moduleAdditional: 'Доп',
    });
    const response = await story.handleCallback(
      'accept-title',
      mentorActor,
      session,
    );

    expect(response.sendMessage?.text).toContain('описание потока');
    const ctx = response.captureInput!.context as Record<string, unknown>;
    expect(ctx.step).toBe(2);
    expect(ctx.title).toBe('JS Basics');
  });

  test('handleCallback "accept-description" — принять описание → шаг 3 (дата)', async () => {
    const { story } = createStory();

    const session = wizardSession({
      step: 2,
      title: 'JS',
      description: 'Курс',
      moduleGoal: 'Цель',
      moduleResult: 'Рез',
      moduleRules: 'Прав',
      moduleTargetAudience: 'Ауд',
      moduleAdditional: 'Доп',
    });
    const response = await story.handleCallback(
      'accept-description',
      mentorActor,
      session,
    );

    expect(response.sendMessage?.text).toContain('дату старта');
    expect(response.sendMessage?.text).toContain('YYYY');
    const ctx = response.captureInput!.context as Record<string, unknown>;
    expect(ctx.step).toBe(3);
  });

  // ── Шаг 1-2: ввод названия и описания ──

  test('handleMessage step 1 — ввод названия → шаг 2', async () => {
    const { story } = createStory();

    const session = wizardSession({
      step: 1,
      moduleId: 'mod-1',
      description: 'Описание потока',
      moduleGoal: 'Цель',
      moduleResult: 'Рез',
      moduleRules: 'Прав',
      moduleTargetAudience: 'Ауд',
      moduleAdditional: 'Доп',
    });
    const response = await story.handleMessage(
      { type: 'message', text: 'Мой поток', telegramId: 123 },
      mentorActor,
      session,
    );

    expect(response.sendMessage?.text).toContain('описание потока');
    const ctx = response.captureInput!.context as Record<string, unknown>;
    expect(ctx.step).toBe(2);
    expect(ctx.title).toBe('Мой поток');
  });

  test('handleMessage step 2 — ввод описания → шаг 3', async () => {
    const { story } = createStory();

    const session = wizardSession({
      step: 2,
      title: 'Поток',
      moduleGoal: 'Цель',
      moduleResult: 'Рез',
      moduleRules: 'Прав',
      moduleTargetAudience: 'Ауд',
      moduleAdditional: 'Доп',
    });
    const response = await story.handleMessage(
      { type: 'message', text: 'Тестовый поток', telegramId: 123 },
      mentorActor,
      session,
    );

    expect(response.sendMessage?.text).toContain('дату старта');
    expect(response.sendMessage?.text).toContain('YYYY');
    const ctx = response.captureInput!.context as Record<string, unknown>;
    expect(ctx.step).toBe(3);
    expect(ctx.description).toBe('Тестовый поток');
  });

  // ── Шаг 3: ввод даты ──

  test('handleMessage step 3 — ввод даты (YYYY-MM-DD) → шаг 4 (цель)', async () => {
    const { story } = createStory();

    const session = wizardSession({
      step: 3,
      title: 'Поток',
      description: 'Описание',
      moduleGoal: 'Стать разработчиком',
      moduleResult: 'Рез',
      moduleRules: 'Прав',
      moduleTargetAudience: 'Ауд',
      moduleAdditional: 'Доп',
    });
    const response = await story.handleMessage(
      { type: 'message', text: '2026-09-01', telegramId: 123 },
      mentorActor,
      session,
    );

    // После даты — переход к полю «Цель»
    expect(response.sendMessage?.text).toContain('Цель');
    const ctx = response.captureInput!.context as Record<string, unknown>;
    expect(ctx.step).toBe(4);
    expect(ctx.startDate).toBe('2026-09-01T00:00');
  });

  test('handleMessage step 3 — ввод даты с временем (ISO)', async () => {
    const { story } = createStory();

    const session = wizardSession({
      step: 3,
      title: 'Поток',
      description: 'Описание',
      moduleGoal: 'Цель',
      moduleResult: 'Рез',
      moduleRules: 'Прав',
      moduleTargetAudience: 'Ауд',
      moduleAdditional: 'Доп',
    });
    const response = await story.handleMessage(
      { type: 'message', text: '2026-09-01T14:00', telegramId: 123 },
      mentorActor,
      session,
    );

    const ctx = response.captureInput!.context as Record<string, unknown>;
    expect(ctx.startDate).toBe('2026-09-01T14:00');
    expect(ctx.step).toBe(4);
  });

  // ── Шаги 4-8: необязательные поля модуля ──

  test('handleCallback "accept-goal" — принять цель → шаг 5 (результат)', async () => {
    const { story } = createStory();

    const session = wizardSession({
      step: 4,
      title: 'Поток',
      description: 'Описание',
      startDate: '2026-09-01T00:00',
      moduleGoal: 'Стать разработчиком',
      moduleResult: 'Сможете создать своё приложение',
      moduleRules: 'Дедлайны',
      moduleTargetAudience: 'Все желающие',
      moduleAdditional: 'Компьютер',
    });

    const response = await story.handleCallback(
      'accept-goal',
      mentorActor,
      session,
    );

    expect(response.sendMessage?.text).toContain('Результат');
    const ctx = response.captureInput!.context as Record<string, unknown>;
    expect(ctx.step).toBe(5);
    expect(ctx.goal).toBe('Стать разработчиком');
  });

  test('handleCallback "skip-goal" — пропустить цель → шаг 5 (результат)', async () => {
    const { story } = createStory();

    const session = wizardSession({
      step: 4,
      title: 'Поток',
      description: 'Описание',
      startDate: '2026-09-01T00:00',
      moduleGoal: 'Стать разработчиком',
      moduleResult: 'Сможете создать своё приложение',
      moduleRules: 'Дедлайны',
      moduleTargetAudience: 'Все желающие',
      moduleAdditional: 'Компьютер',
    });

    const response = await story.handleCallback(
      'skip-goal',
      mentorActor,
      session,
    );

    expect(response.sendMessage?.text).toContain('Результат');
    const ctx = response.captureInput!.context as Record<string, unknown>;
    expect(ctx.step).toBe(5);
    expect(ctx.goal).toBe('');
  });

  test('handleCallback "accept-result" — принять результат → шаг 6 (правила)', async () => {
    const { story } = createStory();

    const session = wizardSession({
      step: 5,
      title: 'Поток',
      description: 'Описание',
      startDate: '2026-09-01T00:00',
      goal: 'Цель',
      moduleGoal: '',
      moduleResult: 'Выпускной проект',
      moduleRules: 'Дедлайны раз в неделю',
      moduleTargetAudience: 'Все желающие',
      moduleAdditional: 'Компьютер',
    });

    const response = await story.handleCallback(
      'accept-result',
      mentorActor,
      session,
    );

    expect(response.sendMessage?.text).toContain('Правила');
    const ctx = response.captureInput!.context as Record<string, unknown>;
    expect(ctx.step).toBe(6);
    expect(ctx.result).toBe('Выпускной проект');
  });

  test('handleCallback "skip-rules" — пропустить правила → шаг 7 (аудитория)', async () => {
    const { story } = createStory();

    const session = wizardSession({
      step: 6,
      title: 'Поток',
      description: 'Описание',
      startDate: '2026-09-01T00:00',
      goal: 'Цель',
      result: 'Результат',
      moduleGoal: '',
      moduleResult: '',
      moduleRules: 'Дедлайны',
      moduleTargetAudience: 'Новички',
      moduleAdditional: 'Компьютер',
    });

    const response = await story.handleCallback(
      'skip-rules',
      mentorActor,
      session,
    );

    expect(response.sendMessage?.text).toContain('Целевая аудитория');
    const ctx = response.captureInput!.context as Record<string, unknown>;
    expect(ctx.step).toBe(7);
    expect(ctx.rules).toBe('');
  });

  test('handleCallback "accept-targetAudience" → шаг 8 (дополнительно)', async () => {
    const { story } = createStory();

    const session = wizardSession({
      step: 7,
      title: 'Поток',
      description: 'Описание',
      startDate: '2026-09-01T00:00',
      goal: 'Цель',
      result: 'Рез',
      rules: 'Прав',
      moduleGoal: '',
      moduleResult: '',
      moduleRules: '',
      moduleTargetAudience: 'Новички в IT',
      moduleAdditional: 'Нужен ноутбук',
    });

    const response = await story.handleCallback(
      'accept-targetAudience',
      mentorActor,
      session,
    );

    expect(response.sendMessage?.text).toContain('Дополнительно');
    const ctx = response.captureInput!.context as Record<string, unknown>;
    expect(ctx.step).toBe(8);
    expect(ctx.targetAudience).toBe('Новички в IT');
  });

  test('handleCallback "skip-additional" → шаг 9 (группа)', async () => {
    const { story } = createStory();

    const session = wizardSession({
      step: 8,
      title: 'Поток',
      description: 'Описание',
      startDate: '2026-09-01T00:00',
      goal: 'Цель',
      result: 'Рез',
      rules: 'Прав',
      targetAudience: 'Ауд',
      moduleGoal: '',
      moduleResult: '',
      moduleRules: '',
      moduleTargetAudience: '',
      moduleAdditional: 'Нужен ноутбук',
    });

    const response = await story.handleCallback(
      'skip-additional',
      mentorActor,
      session,
    );

    expect(response.sendMessage?.text).toContain('Telegram');
    const ctx = response.captureInput!.context as Record<string, unknown>;
    expect(ctx.step).toBe(9);
    expect(ctx.additional).toBe('');
  });

  test('handleMessage step 4 — ввод цели вручную', async () => {
    const { story } = createStory();

    const session = wizardSession({
      step: 4,
      title: 'Поток',
      description: 'Описание',
      startDate: '2026-09-01T00:00',
      moduleGoal: 'Цель из модуля',
      moduleResult: 'Рез',
      moduleRules: 'Прав',
      moduleTargetAudience: 'Ауд',
      moduleAdditional: 'Доп',
    });

    const response = await story.handleMessage(
      { type: 'message', text: 'Моя цель', telegramId: 123 },
      mentorActor,
      session,
    );

    expect(response.sendMessage?.text).toContain('Результат');
    const ctx = response.captureInput!.context as Record<string, unknown>;
    expect(ctx.step).toBe(5);
    expect(ctx.goal).toBe('Моя цель');
  });

  test('handleMessage step 8 (дополнительно) → переход к группе', async () => {
    const { story } = createStory();

    const session = wizardSession({
      step: 8,
      title: 'Поток',
      description: 'Описание',
      startDate: '2026-09-01T00:00',
      goal: 'Цель',
      result: 'Рез',
      rules: 'Прав',
      targetAudience: 'Ауд',
      moduleAdditional: '',
    });

    const response = await story.handleMessage(
      { type: 'message', text: 'Дополнительная информация', telegramId: 123 },
      mentorActor,
      session,
    );

    expect(response.sendMessage?.text).toContain('Telegram');
    const ctx = response.captureInput!.context as Record<string, unknown>;
    expect(ctx.step).toBe(9);
    expect(ctx.additional).toBe('Дополнительная информация');
  });

  // ── Шаг 9: группа ──

  test('handleCallback "skip-group" — пропуск группы → шаг 10 (кодовое слово)', async () => {
    const { story } = createStory();

    const session = wizardSession({
      step: 9,
      title: 'Поток',
      description: 'Описание',
      startDate: '2026-09-01T00:00',
      goal: 'Цель',
      result: 'Рез',
      rules: 'Прав',
      targetAudience: 'Ауд',
      additional: 'Доп',
    });

    const response = await story.handleCallback(
      'skip-group',
      mentorActor,
      session,
    );

    expect(response.sendMessage?.text).toContain('кодовое слово');
    const ctx = response.captureInput!.context as Record<string, unknown>;
    expect(ctx.step).toBe(10);
    expect(ctx.telegramGroupId).toBe('');
  });

  test('handleMessage step 9 — ввод группы → шаг 10', async () => {
    const { story } = createStory();

    const session = wizardSession({
      step: 9,
      title: 'Поток',
      description: 'Описание',
      startDate: '2026-09-01T00:00',
      goal: 'Цель',
      result: 'Рез',
      rules: 'Прав',
      targetAudience: 'Ауд',
      additional: 'Доп',
    });

    const response = await story.handleMessage(
      { type: 'message', text: 'https://t.me/joinchat/abc', telegramId: 123 },
      mentorActor,
      session,
    );

    expect(response.sendMessage?.text).toContain('кодовое слово');
    const ctx = response.captureInput!.context as Record<string, unknown>;
    expect(ctx.step).toBe(10);
    expect(ctx.telegramGroupId).toBe('https://t.me/joinchat/abc');
  });

  // ── Шаг 10: кодовое слово ──

  test('handleCallback "skip-key" — пропуск кодового слова → превью', async () => {
    const { story } = createStory();

    const session = wizardSession({
      step: 10,
      title: 'Мой Поток',
      description: 'Описание',
      startDate: '2026-09-01T14:00',
      telegramGroupId: 'https://t.me/group',
      goal: 'Научиться',
      result: 'Проект',
      rules: 'Дедлайны',
      targetAudience: 'Новички',
      additional: 'Ноутбук',
    });

    const response = await story.handleCallback(
      'skip-key',
      mentorActor,
      session,
    );

    expect(response.sendMessage?.text).toContain('Превью потока');
    expect(response.sendMessage?.text).toContain('Мой Поток');
    expect(response.sendMessage?.text).toContain('Научиться');
    expect(response.sendMessage?.text).toContain('Проект');
    const ctx = response.captureInput!.context as Record<string, unknown>;
    expect(ctx.step).toBe(11);
    expect(ctx.enrollmentKey).toBe('');
  });

  test('handleMessage step 10 — ввод кодового слова → превью', async () => {
    const { story } = createStory();

    const session = wizardSession({
      step: 10,
      title: 'Поток',
      description: 'Описание',
      startDate: '2026-09-01T00:00',
      goal: 'Цель',
      result: 'Рез',
      rules: 'Прав',
      targetAudience: 'Ауд',
      additional: 'Доп',
    });

    const response = await story.handleMessage(
      { type: 'message', text: 'secret123', telegramId: 123 },
      mentorActor,
      session,
    );

    expect(response.sendMessage?.text).toContain('Превью потока');
    const ctx = response.captureInput!.context as Record<string, unknown>;
    expect(ctx.step).toBe(11);
    expect(ctx.enrollmentKey).toBe('secret123');
  });

  // ── Шаг 11: превью и подтверждение ──

  test('handleCallback "confirm" — успешное создание потока', async () => {
    let createCalled = false;
    const { story } = createStory({
      'create-stream': (() => {
        createCalled = true;
      }) as unknown,
    });

    const session = wizardSession({
      step: 11,
      moduleId: 'mod-1',
      title: 'Мой Поток',
      description: 'Описание',
      startDate: '2026-09-01T14:00',
      telegramGroupId: 'https://t.me/group',
      goal: 'Цель',
      result: 'Результат',
      rules: 'Правила',
      targetAudience: 'Аудитория',
      additional: 'Дополнительно',
      enrollmentKey: 'secret',
    });

    const response = await story.handleCallback(
      'confirm',
      mentorActor,
      session,
    );

    expect(createCalled).toBe(true);
    expect(response.sendMessage?.text).toContain('успешно создан');
    expect(response.releaseInput).toBe(true);
  });

  test('handleCallback "confirm" — ошибка при создании', async () => {
    const { story } = createStory({
      'create-stream': (() => {
        throw new Error('Ошибка создания');
      }) as unknown,
    });

    const session = wizardSession({
      step: 11,
      moduleId: 'mod-1',
      title: 'Поток',
      description: 'Описание',
      startDate: '2026-09-01T00:00',
    });

    const response = await story.handleCallback(
      'confirm',
      mentorActor,
      session,
    );

    expect(response.sendMessage?.text).toContain('⚠️');
  });

  test('handleCallback "confirm" — контекст потерян', async () => {
    const { story } = createStory();

    const response = await story.handleCallback(
      'confirm',
      mentorActor,
      NO_SESSION,
    );

    expect(response.sendMessage?.text).toContain('потерян');
  });

  test('handleMessage step 11 — предлагает использовать кнопки', async () => {
    const { story } = createStory();

    const session = wizardSession({ step: 11 });
    const response = await story.handleMessage(
      { type: 'message', text: 'да', telegramId: 123 },
      mentorActor,
      session,
    );

    expect(response.sendMessage?.text).toContain('Используйте кнопки выше');
  });

  // ── Ошибки ──

  test('handleMessage без контекста — ошибка', async () => {
    const { story } = createStory();

    const response = await story.handleMessage(
      { type: 'message', text: 'что-то', telegramId: 123 },
      mentorActor,
      NO_SESSION,
    );

    expect(response.sendMessage?.text).toContain('потерян');
  });

  test('handleMessage неизвестный шаг — ошибка', async () => {
    const { story } = createStory();

    const session = wizardSession({ step: 99 });
    const response = await story.handleMessage(
      { type: 'message', text: 'что-то', telegramId: 123 },
      mentorActor,
      session,
    );

    expect(response.sendMessage?.text).toContain('Неизвестный шаг');
  });

  test('handleCallback неизвестная команда — ошибка', async () => {
    const { story } = createStory();

    const response = await story.handleCallback(
      'unknown',
      mentorActor,
      NO_SESSION,
    );

    expect(response.sendMessage?.text).toContain('Неизвестная команда');
  });

  test('handleMessage не-текстовое (не message) — ошибка', async () => {
    const { story } = createStory();

    const response = await story.handleMessage(
      { type: 'document', fileId: 'some-file', telegramId: 123 },
      mentorActor,
      wizardSession({ step: 1 }),
    );

    expect(response.sendMessage?.text).toContain('текстовое сообщение');
  });

  // ── handleCancel и handleTimeout ──

  test('handleCancel — отмена создания', async () => {
    const { story } = createStory();

    const response = await story.handleCancel(mentorActor, NO_SESSION);

    expect(response.sendMessage?.text).toContain('отменено');
    expect(response.releaseInput).toBe(true);
  });

  test('handleTimeout — таймаут', async () => {
    const { story } = createStory();

    const response = await story.handleTimeout(mentorActor, NO_SESSION);

    expect(response.sendMessage?.text).toContain('истекло');
    expect(response.releaseInput).toBe(true);
  });
});
