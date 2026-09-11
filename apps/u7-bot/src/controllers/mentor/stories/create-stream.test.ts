import { describe, expect, mock, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import type {
  BotSession,
  CommandUpdate,
  DialogResponse,
} from '@u7-scl/core/ui';
import { assertDialogResponseMarkdownSafe } from '@u7-scl/core/ui';
import { Role } from '@u7-scl/user/domain';
import { CreateStreamStory } from './create-stream';

/** Контекст wizard-а (живёт в dialog.input.context) */
type WizardCtx = Record<string, unknown>;

/** Сессия с ожидающим вводом и контекстом wizard-а */
function wizardSession(step: number, extra: WizardCtx = {}): BotSession {
  return {
    dialog: {
      path: 'mentor/create-stream',
      seq: 2,
      input: { context: { step, ...extra } },
    },
  };
}

const NO_SESSION: BotSession = {
  dialog: { path: 'mentor/create-stream', seq: 2 },
};

const mentorActor: User = {
  uuid: 'mentor-1',
  name: 'Ментор Тест',
  telegramId: 123,
  roles: [Role.MENTOR],
  createdAt: '2026-01-01T00:00:00.000Z',
};

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

/** Полный набор module*-полей для wizard-сессий */
const MOD_FIELDS: WizardCtx = {
  moduleGoal: 'Цель',
  moduleResult: 'Рез',
  moduleRules: 'Прав',
  moduleTargetAudience: 'Ауд',
  moduleAdditional: 'Доп',
};

function createStory(apiOverrides?: Record<string, unknown>) {
  const story = new CreateStreamStory();
  const appApi = {
    execute: mock(async (name: string, params?: Record<string, unknown>) => {
      if (apiOverrides && name in apiOverrides) {
        const val = apiOverrides[name];
        if (typeof val === 'function') return (val as () => unknown)();
        if (val instanceof Error) throw val;
        return val;
      }
      if (name === 'list-modules') return [mockModule];
      if (name === 'get-module') {
        const uuid = params?.uuid;
        if (uuid === mockModule.uuid) return mockModule;
        return { title: '', description: '' };
      }
      return undefined;
    }),
  };
  // Второй аргумент — имя контроллера (для isActive в pipe-командах)
  story.init({ appApi } as never, { name: 'mentor' } as never);
  return { story, appApi };
}

const inputMsg = (text: string) => ({
  type: 'message' as const,
  text,
  telegramId: 123,
});

const cancelCmd = (): CommandUpdate => ({
  type: 'command',
  command: 'cancel',
  args: '',
  telegramId: 123,
});

function ctxOf(response: DialogResponse): WizardCtx {
  return (response.awaitInput?.context ?? {}) as WizardCtx;
}

describe('CreateStreamStory (US-6) — контракт «Диалог и Экран»', () => {
  test('menuButtons: пусто (создание только через подменю)', () => {
    const { story } = createStory();
    expect(story.menuButtons(mentorActor)).toEqual([]);
  });

  // ── Шаг 0: выбор модуля ──

  test('start: список модулей + awaitInput (контекст wizard-а)', async () => {
    const { story } = createStory();
    const response = await story.handleCallback(
      'start',
      mentorActor,
      NO_SESSION,
    );
    assertDialogResponseMarkdownSafe(response);

    expect(String(response.screen?.text)).toContain('Выберите модуль');
    expect(response.screen?.keyboard?.rows).toEqual([
      [{ text: 'JavaScript Основы', code: 'create-stream:module:mod-1' }],
    ]);
    expect(response.awaitInput?.context).toBeDefined();
  });

  test('start: нет модулей — экран с кнопкой «Обновить список»', async () => {
    const { story } = createStory({ 'list-modules': [] });
    const response = await story.handleCallback(
      'start',
      mentorActor,
      NO_SESSION,
    );
    expect(String(response.screen?.text)).toContain('Нет доступных модулей');
    expect(response.screen?.keyboard?.rows).toEqual([
      [{ text: '🔄 Обновить список', code: 'create-stream:start' }],
    ]);
    expect(response.awaitInput).toBeDefined();
  });

  // ── Шаг 1: модуль выбран → название ──

  test('module:{id}: шаг 1 (название), подсказка модуля, кнопка «Принять»', async () => {
    const { story } = createStory();
    const response = await story.handleCallback(
      'module:mod-1',
      mentorActor,
      NO_SESSION,
    );

    const text = String(response.screen?.text);
    expect(text).toContain('название потока');
    expect(text).toContain('JavaScript Основы');
    expect(response.screen?.keyboard?.rows).toEqual([
      [{ text: '✅ Принять', code: 'create-stream:accept-title' }],
    ]);
    const ctx = ctxOf(response);
    expect(ctx.step).toBe(1);
    expect(ctx.moduleId).toBe('mod-1');
    expect(ctx.title).toBe('JavaScript Основы');
  });

  test('accept-title: шаг 2 (описание)', async () => {
    const { story } = createStory();
    const session = wizardSession(1, {
      moduleId: 'mod-1',
      title: 'JS Basics',
      description: 'Описание потока',
      ...MOD_FIELDS,
    });
    const response = await story.handleCallback(
      'accept-title',
      mentorActor,
      session,
    );

    expect(String(response.screen?.text)).toContain('описание потока');
    expect(response.screen?.keyboard?.rows).toEqual([
      [{ text: '✅ Принять', code: 'create-stream:accept-description' }],
    ]);
    const ctx = ctxOf(response);
    expect(ctx.step).toBe(2);
    expect(ctx.title).toBe('JS Basics');
  });

  test('accept-description: шаг 3 (дата старта)', async () => {
    const { story } = createStory();
    const session = wizardSession(2, {
      title: 'JS',
      description: 'Курс',
      ...MOD_FIELDS,
    });
    const response = await story.handleCallback(
      'accept-description',
      mentorActor,
      session,
    );

    const text = String(response.screen?.text);
    expect(text).toContain('дату старта');
    expect(text).toContain('YYYY');
    expect(ctxOf(response).step).toBe(3);
  });

  // ── Ввод названия/описания/даты ──

  test('ввод шаг 1 — название → шаг 2', async () => {
    const { story } = createStory();
    const session = wizardSession(1, {
      moduleId: 'mod-1',
      description: 'Описание потока',
      ...MOD_FIELDS,
    });
    const response = await story.handleMessage(
      inputMsg('Мой поток'),
      mentorActor,
      session,
    );
    expect(String(response.screen?.text)).toContain('описание потока');
    const ctx = ctxOf(response);
    expect(ctx.step).toBe(2);
    expect(ctx.title).toBe('Мой поток');
  });

  test('ввод шаг 2 — описание → шаг 3', async () => {
    const { story } = createStory();
    const session = wizardSession(2, { title: 'Поток', ...MOD_FIELDS });
    const response = await story.handleMessage(
      inputMsg('Тестовый поток'),
      mentorActor,
      session,
    );
    expect(String(response.screen?.text)).toContain('дату старта');
    const ctx = ctxOf(response);
    expect(ctx.step).toBe(3);
    expect(ctx.description).toBe('Тестовый поток');
  });

  test('ввод шаг 3 — дата YYYY-MM-DD → шаг 4 (Цель)', async () => {
    const { story } = createStory();
    const session = wizardSession(3, {
      title: 'Поток',
      description: 'Описание',
      moduleGoal: 'Стать разработчиком',
      moduleResult: 'Рез',
      moduleRules: 'Прав',
      moduleTargetAudience: 'Ауд',
      moduleAdditional: 'Доп',
    });
    const response = await story.handleMessage(
      inputMsg('2026-09-01'),
      mentorActor,
      session,
    );
    expect(String(response.screen?.text)).toContain('Цель');
    const ctx = ctxOf(response);
    expect(ctx.step).toBe(4);
    expect(ctx.startDate).toBe('2026-09-01T00:00');
  });

  test('ввод шаг 3 — дата со временем (ISO) сохраняется', async () => {
    const { story } = createStory();
    const session = wizardSession(3, {
      title: 'П',
      description: 'О',
      ...MOD_FIELDS,
    });
    const response = await story.handleMessage(
      inputMsg('2026-09-01T14:00'),
      mentorActor,
      session,
    );
    const ctx = ctxOf(response);
    expect(ctx.startDate).toBe('2026-09-01T14:00');
    expect(ctx.step).toBe(4);
  });

  // ── Шаги 4-8: необязательные поля (accept/skip/ввод) ──

  test('accept-goal: цель из модуля → шаг 5 (Результат)', async () => {
    const { story } = createStory();
    const session = wizardSession(4, {
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
    expect(String(response.screen?.text)).toContain('Результат');
    const ctx = ctxOf(response);
    expect(ctx.step).toBe(5);
    expect(ctx.goal).toBe('Стать разработчиком');
  });

  test('skip-goal: пустая цель → шаг 5', async () => {
    const { story } = createStory();
    const session = wizardSession(4, {
      title: 'Поток',
      startDate: '2026-09-01T00:00',
      moduleGoal: 'Стать разработчиком',
      moduleResult: 'Рез',
      moduleRules: 'Прав',
      moduleTargetAudience: 'Ауд',
      moduleAdditional: 'Доп',
    });
    const response = await story.handleCallback(
      'skip-goal',
      mentorActor,
      session,
    );
    expect(String(response.screen?.text)).toContain('Результат');
    const ctx = ctxOf(response);
    expect(ctx.step).toBe(5);
    expect(ctx.goal).toBe('');
  });

  test('accept-result → шаг 6 (Правила)', async () => {
    const { story } = createStory();
    const session = wizardSession(5, {
      title: 'Поток',
      goal: 'Цель',
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
    expect(String(response.screen?.text)).toContain('Правила');
    const ctx = ctxOf(response);
    expect(ctx.step).toBe(6);
    expect(ctx.result).toBe('Выпускной проект');
  });

  test('skip-rules → шаг 7 (Целевая аудитория)', async () => {
    const { story } = createStory();
    const session = wizardSession(6, {
      title: 'Поток',
      goal: 'Цель',
      result: 'Результат',
      moduleRules: 'Дедлайны',
      moduleTargetAudience: 'Новички',
      moduleAdditional: 'Компьютер',
    });
    const response = await story.handleCallback(
      'skip-rules',
      mentorActor,
      session,
    );
    expect(String(response.screen?.text)).toContain('Целевая аудитория');
    const ctx = ctxOf(response);
    expect(ctx.step).toBe(7);
    expect(ctx.rules).toBe('');
  });

  test('accept-targetAudience → шаг 8 (Дополнительно)', async () => {
    const { story } = createStory();
    const session = wizardSession(7, {
      title: 'Поток',
      goal: 'Цель',
      result: 'Рез',
      rules: 'Прав',
      moduleTargetAudience: 'Новички в IT',
      moduleAdditional: 'Нужен ноутбук',
    });
    const response = await story.handleCallback(
      'accept-targetAudience',
      mentorActor,
      session,
    );
    expect(String(response.screen?.text)).toContain('Дополнительно');
    const ctx = ctxOf(response);
    expect(ctx.step).toBe(8);
    expect(ctx.targetAudience).toBe('Новички в IT');
  });

  test('skip-additional → шаг 9 (Telegram-группа)', async () => {
    const { story } = createStory();
    const session = wizardSession(8, {
      title: 'Поток',
      goal: 'Цель',
      result: 'Рез',
      rules: 'Прав',
      targetAudience: 'Ауд',
      moduleAdditional: 'Нужен ноутбук',
    });
    const response = await story.handleCallback(
      'skip-additional',
      mentorActor,
      session,
    );
    expect(String(response.screen?.text)).toContain('Telegram');
    const ctx = ctxOf(response);
    expect(ctx.step).toBe(9);
    expect(ctx.additional).toBe('');
  });

  test('ввод шаг 4 — цель вручную → шаг 5', async () => {
    const { story } = createStory();
    const session = wizardSession(4, {
      title: 'Поток',
      startDate: '2026-09-01T00:00',
      moduleGoal: 'Цель из модуля',
      moduleResult: 'Рез',
      moduleRules: 'Прав',
      moduleTargetAudience: 'Ауд',
      moduleAdditional: 'Доп',
    });
    const response = await story.handleMessage(
      inputMsg('Моя цель'),
      mentorActor,
      session,
    );
    expect(String(response.screen?.text)).toContain('Результат');
    const ctx = ctxOf(response);
    expect(ctx.step).toBe(5);
    expect(ctx.goal).toBe('Моя цель');
  });

  test('ввод шаг 8 — дополнительно → шаг 9 (группа)', async () => {
    const { story } = createStory();
    const session = wizardSession(8, {
      title: 'Поток',
      goal: 'Цель',
      result: 'Рез',
      rules: 'Прав',
      targetAudience: 'Ауд',
      moduleAdditional: '',
    });
    const response = await story.handleMessage(
      inputMsg('Дополнительная информация'),
      mentorActor,
      session,
    );
    expect(String(response.screen?.text)).toContain('Telegram');
    const ctx = ctxOf(response);
    expect(ctx.step).toBe(9);
    expect(ctx.additional).toBe('Дополнительная информация');
  });

  // ── Шаги 9-11: группа, инвайт, кодовое слово ──

  test('skip-group → шаг 10 (инвайт-ссылка)', async () => {
    const { story } = createStory();
    const session = wizardSession(9, {
      title: 'Поток',
      goal: 'Цель',
      additional: 'Доп',
    });
    const response = await story.handleCallback(
      'skip-group',
      mentorActor,
      session,
    );
    expect(String(response.screen?.text)).toContain('инвайт');
    const ctx = ctxOf(response);
    expect(ctx.step).toBe(10);
    expect(ctx.telegramGroupId).toBe('');
  });

  test('ввод шаг 9 — ID группы → шаг 10', async () => {
    const { story } = createStory();
    const session = wizardSession(9, { title: 'Поток', additional: 'Доп' });
    const response = await story.handleMessage(
      inputMsg('-100123456789'),
      mentorActor,
      session,
    );
    expect(String(response.screen?.text)).toContain('инвайт');
    const ctx = ctxOf(response);
    expect(ctx.step).toBe(10);
    expect(ctx.telegramGroupId).toBe('-100123456789');
  });

  test('skip-invite → шаг 11 (кодовое слово)', async () => {
    const { story } = createStory();
    const session = wizardSession(10, {
      title: 'Поток',
      telegramGroupId: '-100123456789',
    });
    const response = await story.handleCallback(
      'skip-invite',
      mentorActor,
      session,
    );
    expect(String(response.screen?.text)).toContain('кодовое слово');
    const ctx = ctxOf(response);
    expect(ctx.step).toBe(11);
    expect(ctx.telegramGroupInvite).toBe('');
  });

  test('ввод шаг 10 — инвайт-ссылка → шаг 11', async () => {
    const { story } = createStory();
    const session = wizardSession(10, {
      title: 'Поток',
      telegramGroupId: '-100123456789',
    });
    const response = await story.handleMessage(
      inputMsg('https://t.me/+abc123'),
      mentorActor,
      session,
    );
    expect(String(response.screen?.text)).toContain('кодовое слово');
    const ctx = ctxOf(response);
    expect(ctx.step).toBe(11);
    expect(ctx.telegramGroupInvite).toBe('https://t.me/+abc123');
  });

  // ── Шаг 12: превью ──

  test('skip-key → превью со всеми полями и точными кнопками', async () => {
    const { story } = createStory();
    const session = wizardSession(11, {
      title: 'Мой Поток',
      description: 'Описание',
      startDate: '2026-09-01T14:00',
      telegramGroupId: '-100123456789',
      telegramGroupInvite: 'https://t.me/+abc123',
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

    const text = String(response.screen?.text);
    expect(text).toContain('Превью потока');
    expect(text).toContain('Мой Поток');
    expect(text).toContain('Научиться');
    expect(text).toContain('Проект');
    expect(text).toContain('ID группы');
    expect(text).toContain('100123456789');
    expect(text).toContain('Ссылка для студентов');
    expect(text).toContain('abc123');
    expect(text).toContain('Всё верно');
    expect(response.screen?.keyboard?.rows).toEqual([
      [
        { text: '✅ Создать', code: 'create-stream:confirm' },
        { text: '⬅️ Изменить', code: 'create-stream:start' },
      ],
    ]);
    const ctx = ctxOf(response);
    expect(ctx.step).toBe(12);
    expect(ctx.enrollmentKey).toBe('');
  });

  test('ввод шаг 11 — кодовое слово → превью', async () => {
    const { story } = createStory();
    const session = wizardSession(11, {
      title: 'Поток',
      goal: 'Цель',
    });
    const response = await story.handleMessage(
      inputMsg('secret123'),
      mentorActor,
      session,
    );
    expect(String(response.screen?.text)).toContain('Превью потока');
    const ctx = ctxOf(response);
    expect(ctx.step).toBe(12);
    expect(ctx.enrollmentKey).toBe('secret123');
  });

  test('ввод шаг 12 — переспрос «Используйте кнопки выше» (реплика, ввод живёт)', async () => {
    const { story } = createStory();
    const response = await story.handleMessage(
      inputMsg('да'),
      mentorActor,
      wizardSession(12),
    );
    expect(String(response.notify?.text)).toContain('Используйте кнопки выше');
    expect(response.screen).toBeUndefined();
    expect(response.release).toBeUndefined();
  });

  // ── confirm: создание потока ──

  test('confirm: UC create-stream с полным cmd, экран успеха + release', async () => {
    const { story, appApi } = createStory();
    const session = wizardSession(12, {
      moduleId: 'mod-1',
      title: 'Мой Поток',
      description: 'Описание',
      startDate: '2026-09-01T14:00',
      telegramGroupId: '-100123456789',
      telegramGroupInvite: 'https://t.me/+abc123',
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

    expect(String(response.screen?.text)).toContain('успешно создан');
    expect(response.release).toBe(true);

    const calls = appApi.execute.mock.calls as unknown[][];
    const call = calls.find((c) => c[0] === 'create-stream');
    expect(call?.[1]).toEqual({
      title: 'Мой Поток',
      description: 'Описание',
      moduleId: 'mod-1',
      startDate: '2026-09-01T14:00',
      telegramGroupId: '-100123456789',
      mentorId: 'mentor-1',
      goal: 'Цель',
      result: 'Результат',
      rules: 'Правила',
      targetAudience: 'Аудитория',
      additional: 'Дополнительно',
      enrollmentKey: 'secret',
      telegramGroupInvite: 'https://t.me/+abc123',
    });
  });

  test('confirm: ошибка UC — экран ошибки', async () => {
    const { story } = createStory({
      'create-stream': () => {
        throw new Error('Ошибка создания');
      },
    });
    const response = await story.handleCallback(
      'confirm',
      mentorActor,
      wizardSession(12, { moduleId: 'mod-1', title: 'Поток' }),
    );
    expect(String(response.screen?.text)).toContain('⚠️');
  });

  test('confirm без контекста — реплика-предупреждение + release', async () => {
    const { story } = createStory();
    const response = await story.handleCallback(
      'confirm',
      mentorActor,
      NO_SESSION,
    );
    expect(String(response.notify?.text)).toContain('потерян');
    expect(response.release).toBe(true);
  });

  // ── Ошибки состояний ──

  test('ввод без контекста — реплика-предупреждение + release', async () => {
    const { story } = createStory();
    const response = await story.handleMessage(
      inputMsg('что-то'),
      mentorActor,
      NO_SESSION,
    );
    expect(String(response.notify?.text)).toContain('потерян');
    expect(response.release).toBe(true);
  });

  test('ввод на неизвестном шаге — реплика-предупреждение', async () => {
    const { story } = createStory();
    const response = await story.handleMessage(
      inputMsg('что-то'),
      mentorActor,
      wizardSession(99),
    );
    expect(String(response.notify?.text)).toContain('Неизвестный шаг');
  });

  test('не-message update — переспрос «текстовое сообщение»', async () => {
    const { story } = createStory();
    const response = await story.handleMessage(
      { type: 'callback', data: 'x', telegramId: 123, messageId: 1 },
      mentorActor,
      wizardSession(1),
    );
    expect(String(response.notify?.text)).toContain('текстовое сообщение');
  });

  test('неизвестная кнопка — экран «Неизвестная команда»', async () => {
    const { story } = createStory();
    const response = await story.handleCallback(
      'unknown',
      mentorActor,
      NO_SESSION,
    );
    expect(String(response.screen?.text)).toContain('Неизвестная');
  });

  // ── /cancel через pipe (CommandReaction) ──

  test('/cancel активной стори — stop с репликой «отменено» + release', async () => {
    const { story } = createStory();
    const reaction = await story.handleCommand(
      cancelCmd(),
      mentorActor,
      wizardSession(3, { title: 'Поток' }),
    );
    expect(reaction.reaction).toBe('stop');
    if (reaction.reaction === 'stop') {
      expect(String(reaction.response.notify?.text)).toContain('отменено');
      expect(reaction.response.release).toBe(true);
    }
  });

  test('/cancel неактивной стори — pass без побочных действий', async () => {
    const { story } = createStory();
    const reaction = await story.handleCommand(
      cancelCmd(),
      mentorActor,
      // Диалог другой стори
      { dialog: { path: 'mentor/monitor', seq: 1 } },
    );
    expect(reaction.reaction).toBe('pass');
  });
});
