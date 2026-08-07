import { describe, expect, mock, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import type { U7BotApp } from '@u7-scl/bot/u7-bot-app-meta';
import type { SessionData } from '@u7-scl/core/ui';
import { assertResponseMarkdownSafe } from '@u7-scl/core/ui';
import { Role } from '@u7-scl/user/domain';
import type { U7BotApp } from '@u7-scl/bot/u7-bot-app-meta';
import { MentorToolsStory } from './mentor-tools.story';

describe('MentorToolsStory', () => {
  const session: SessionData = { activeHandler: null };

  const guestActor: User = {
    uuid: 'user-1',
    name: 'Гость',
    telegramId: 123,
    roles: [Role.GUEST],
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  const studentActor: User = {
    uuid: 'user-2',
    name: 'Студент',
    telegramId: 456,
    roles: [Role.STUDENT],
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  const mentorActor: User = {
    uuid: 'mentor-1',
    name: 'Ментор',
    telegramId: 999,
    roles: [Role.MENTOR],
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  const adminActor: User = {
    uuid: 'admin-1',
    name: 'Админ',
    telegramId: 777,
    roles: [Role.ADMIN],
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  const emptyModuleApi = {
    execute: mock(() => undefined),
  } as unknown as U7BotApp;

  const emptyAppApi = {
    execute: mock(() => undefined),
  } as unknown as U7BotApp;

  function makeStory() {
    const story = new MentorToolsStory();
    story.init(emptyModuleApi, emptyAppApi);
    return story;
  }

  // ── handleStart — role-gating ──

  test('MENTOR видит кнопку «🛠️ Инструменты ментора» в главном меню', async () => {
    const story = makeStory();
    const item = await story.handleStart(mentorActor);
    expect(item).not.toBeNull();
    expect(item?.text).toContain('Инструменты ментора');
    expect(item?.kind).toBe('callback');
  });

  test('ADMIN видит кнопку «🛠️ Инструменты ментора» в главном меню', async () => {
    const story = makeStory();
    const item = await story.handleStart(adminActor);
    expect(item).not.toBeNull();
    expect(item?.text).toContain('Инструменты ментора');
  });

  test('GUEST НЕ видит кнопку «Инструменты ментора»', async () => {
    const story = makeStory();
    const item = await story.handleStart(guestActor);
    expect(item).toBeNull();
  });

  test('STUDENT НЕ видит кнопку «Инструменты ментора»', async () => {
    const story = makeStory();
    const item = await story.handleStart(studentActor);
    expect(item).toBeNull();
  });

  test('handleStart возвращает корректный priority', async () => {
    const story = makeStory();
    const item = await story.handleStart(mentorActor);
    expect(item?.priority).toBe(30);
  });

  test('handleStart содержит описание для /help', async () => {
    const story = makeStory();
    const item = await story.handleStart(mentorActor);
    expect(item?.description).toContain('Инструменты ментора');
  });

  // ── handleCallback("start") — подменю ──

  test('handleCallback("start") показывает подменю с кнопками Мои потоки и Создать поток', async () => {
    const story = makeStory();
    const response = await story.handleCallback('start', mentorActor, session);

    assertResponseMarkdownSafe(response);
    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('Инструменты ментора');

    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];

    expect(btnTexts).toContain('📋 Мои потоки');
    expect(btnTexts).toContain('➕ Создать поток');
    // Кнопки «👥 Мониторинг» нет — мониторинг встроен в карточку потока
    expect(btnTexts).not.toContain('👥 Мониторинг');
  });

  test('MENTOR видит кнопки подменю: Мои потоки, Создать поток, Назад', async () => {
    const story = makeStory();
    const response = await story.handleCallback('start', mentorActor, session);

    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btnTexts).toContain('📋 Мои потоки');
    expect(btnTexts).toContain('➕ Создать поток');
    expect(btnTexts).not.toContain('👥 Мониторинг');
  });

  test('GUEST получает ошибку при попытке открыть подменю', async () => {
    const story = makeStory();
    const response = await story.handleCallback('start', guestActor, session);

    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('доступ');
  });

  test('STUDENT получает ошибку при попытке открыть подменю', async () => {
    const story = makeStory();
    const response = await story.handleCallback('start', studentActor, session);

    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('доступ');
  });

  // ── Кнопка «Создать поток» делегирует в CreateStreamStory ──

  test('кнопка «➕ Создать поток» делегирует в create-stream:start', async () => {
    const story = makeStory();
    const response = await story.handleCallback('start', mentorActor, session);

    const createBtn = response.sendMessage?.keyboard?.rows
      .flat()
      .find((b) => b.text === '➕ Создать поток');

    expect(createBtn).toBeDefined();
    expect(createBtn?.code).toContain('create-stream:start');
  });

  // ── Кнопка «Мои потоки» делегирует в список потоков ментора ──

  test('кнопка «📋 Мои потоки» делегирует в mentor-tools:my-streams', async () => {
    const story = makeStory();
    const response = await story.handleCallback('start', mentorActor, session);

    const streamsBtn = response.sendMessage?.keyboard?.rows
      .flat()
      .find((b) => b.text === '📋 Мои потоки');

    expect(streamsBtn).toBeDefined();
    expect(streamsBtn?.code).toContain('mentor-tools:my-streams');
  });

  // ── Кнопка «Назад» в подменю ──

  test('подменю содержит кнопку «🔙 Назад» для возврата в главное меню', async () => {
    const story = makeStory();
    const response = await story.handleCallback('start', mentorActor, session);

    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btnTexts.some((t) => t.includes('Назад'))).toBe(true);
  });

  // ── handleCallback("my-streams") ──

  test('«Мои потоки» — без потоков ментора показывает заглушку', async () => {
    const appApi = {
      execute: mock((name: string) => {
        if (name === 'list-streams') return [];
        return undefined;
      }),
    } as unknown as U7BotApp;

    const story = new MentorToolsStory();
    story.init(appApi, undefined as never);

    const response = await story.handleCallback(
      'my-streams',
      mentorActor,
      session,
    );

    expect(response.sendMessage?.text).toContain('нет потоков');
  });

  test('«Мои потоки» — показывает только потоки ментора', async () => {
    const appApi = {
      execute: mock((name: string) => {
        if (name === 'list-streams')
          return [
            {
              uuid: 's-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s',
              title: 'Мой поток',
              status: 'active',
              mentorId: 'mentor-1',
            },
            {
              uuid: 'x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x',
              title: 'Чужой поток',
              status: 'enrollment',
              mentorId: 'other-mentor',
            },
          ];
        return undefined;
      }),
    } as unknown as U7BotApp;

    const story = new MentorToolsStory();
    story.init(appApi, undefined as never);

    const response = await story.handleCallback(
      'my-streams',
      mentorActor,
      session,
    );

    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    // Показывает свой поток
    expect(btnTexts.some((t) => t.includes('Мой поток'))).toBe(true);
    // НЕ показывает чужой поток
    expect(btnTexts.some((t) => t.includes('Чужой поток'))).toBe(false);

    // Код кнопки использует view-stream-mentor (не view-stream)
    const myStreamBtn = response.sendMessage?.keyboard?.rows
      .flat()
      .find((b) => b.text.includes('Мой поток'));
    expect(myStreamBtn?.code).toContain('view-stream-mentor:view:');
    expect(myStreamBtn?.code).not.toContain('view-stream:view:');
  });

  test('«Мои потоки» — ошибка загрузки показывает сообщение', async () => {
    const appApi = {
      execute: mock(() => {
        throw new Error('DB error');
      }),
    } as unknown as U7BotApp;

    const story = new MentorToolsStory();
    story.init(appApi, undefined as never);

    const response = await story.handleCallback(
      'my-streams',
      mentorActor,
      session,
    );

    expect(response.sendMessage?.text).toContain('Не удалось загрузить');
  });

  test('«Мои потоки» — по умолчанию только enrollment и active, есть toggle-кнопки', async () => {
    const appApi = {
      execute: mock((name: string) => {
        if (name === 'list-streams')
          return [
            {
              uuid: 'a-a-a-a-a-a-a-a-a-a-a-a-a-a-a-a',
              title: 'Активный поток',
              status: 'active',
              mentorId: 'mentor-1',
            },
            {
              uuid: 'b-b-b-b-b-b-b-b-b-b-b-b-b-b-b-b',
              title: 'Запущенный поток',
              status: 'enrollment',
              mentorId: 'mentor-1',
            },
            {
              uuid: 'c-c-c-c-c-c-c-c-c-c-c-c-c-c-c-c',
              title: 'Завершённый поток',
              status: 'completed',
              mentorId: 'mentor-1',
            },
            {
              uuid: 'd-d-d-d-d-d-d-d-d-d-d-d-d-d-d-d',
              title: 'Архивный поток',
              status: 'archived',
              mentorId: 'mentor-1',
            },
          ];
        return undefined;
      }),
    } as unknown as U7BotApp;

    const story = new MentorToolsStory();
    story.init(appApi, undefined as never);

    const response = await story.handleCallback(
      'my-streams',
      mentorActor,
      session,
    );

    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    // Видит active и enrollment
    expect(btnTexts.some((t) => t.includes('Активный'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Запущенный'))).toBe(true);
    // НЕ видит completed и archived
    expect(btnTexts.some((t) => t.includes('Завершённый'))).toBe(false);
    expect(btnTexts.some((t) => t.includes('Архивный'))).toBe(false);
    // Toggle-кнопки есть
    expect(btnTexts.some((t) => t.includes('Вкл. архивированные'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Вкл. завершённые'))).toBe(true);
    // Легенда в тексте
    expect(response.sendMessage?.text).toContain('🟡');
    expect(response.sendMessage?.text).toContain('🔵');
  });

  test('«Мои потоки» — toggle завершённых показывает completed', async () => {
    const appApi = {
      execute: mock((name: string) => {
        if (name === 'list-streams')
          return [
            {
              uuid: 'a-a-a-a-a-a-a-a-a-a-a-a-a-a-a-a',
              title: 'Активный поток',
              status: 'active',
              mentorId: 'mentor-1',
            },
            {
              uuid: 'c-c-c-c-c-c-c-c-c-c-c-c-c-c-c-c',
              title: 'Завершённый поток',
              status: 'completed',
              mentorId: 'mentor-1',
            },
          ];
        return undefined;
      }),
    } as unknown as U7BotApp;

    const story = new MentorToolsStory();
    story.init(appApi, undefined as never);

    const response = await story.handleCallback(
      'my-streams:completed:1',
      mentorActor,
      session,
    );

    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btnTexts.some((t) => t.includes('Активный'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Завершённый'))).toBe(true);
    // Эмодзи статусов
    expect(btnTexts.some((t) => t.includes('🔵'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('🟢'))).toBe(true);
  });

  test('«Мои потоки» — toggle архивированных показывает archived', async () => {
    const appApi = {
      execute: mock((name: string) => {
        if (name === 'list-streams')
          return [
            {
              uuid: 'a-a-a-a-a-a-a-a-a-a-a-a-a-a-a-a',
              title: 'Активный поток',
              status: 'active',
              mentorId: 'mentor-1',
            },
            {
              uuid: 'd-d-d-d-d-d-d-d-d-d-d-d-d-d-d-d',
              title: 'Архивный поток',
              status: 'archived',
              mentorId: 'mentor-1',
            },
          ];
        return undefined;
      }),
    } as unknown as U7BotApp;

    const story = new MentorToolsStory();
    story.init(appApi, undefined as never);

    const response = await story.handleCallback(
      'my-streams:archived:1',
      mentorActor,
      session,
    );

    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btnTexts.some((t) => t.includes('Активный'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Архивный'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('⚫'))).toBe(true);
  });

  test('«Мои потоки» — оба toggle включены: видны все', async () => {
    const appApi = {
      execute: mock((name: string) => {
        if (name === 'list-streams')
          return [
            {
              uuid: 'a-a-a-a-a-a-a-a-a-a-a-a-a-a-a-a',
              title: 'Активный',
              status: 'active',
              mentorId: 'mentor-1',
            },
            {
              uuid: 'c-c-c-c-c-c-c-c-c-c-c-c-c-c-c-c',
              title: 'Завершённый',
              status: 'completed',
              mentorId: 'mentor-1',
            },
            {
              uuid: 'd-d-d-d-d-d-d-d-d-d-d-d-d-d-d-d',
              title: 'Архивный',
              status: 'archived',
              mentorId: 'mentor-1',
            },
          ];
        return undefined;
      }),
    } as unknown as U7BotApp;

    const story = new MentorToolsStory();
    story.init(appApi, undefined as never);

    const response = await story.handleCallback(
      'my-streams:archived:1:completed:1',
      mentorActor,
      session,
    );

    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btnTexts.some((t) => t.includes('Активный'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Завершённый'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Архивный'))).toBe(true);
    // Переключателей нет (оба включены)
    expect(btnTexts.some((t) => t.includes('Вкл.'))).toBe(false);
  });

  // ── handleMessage ──

  test('handleMessage отдаёт сообщение с подсказкой', async () => {
    const story = makeStory();
    const response = await story.handleMessage(
      { type: 'message', text: 'что-то', telegramId: 123 },
      mentorActor,
      session,
    );
    expect(response.sendMessage?.text).toContain('кнопки меню');
  });

  // ── Неизвестный action ──

  test('неизвестный callback action возвращает ошибку', async () => {
    const story = makeStory();
    const response = await story.handleCallback(
      'unknown-action',
      mentorActor,
      session,
    );
    expect(response.sendMessage?.text).toContain('Неизвестная команда');
  });
});
