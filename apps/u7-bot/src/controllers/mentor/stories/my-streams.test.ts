import { describe, expect, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import { Role } from '@u7-scl/user/domain';
import { MyStreamsStory } from './my-streams';

function createStory(): MyStreamsStory {
  const story = new MyStreamsStory();
  return story;
}

function mentorActor(): User {
  return {
    uuid: 'mentor-1',
    name: 'Ментор',
    telegramId: 123,
    roles: [Role.MENTOR],
    createdAt: '2026-01-01T00:00:00.000Z',
  };
}

const mockStreams = [
  { uuid: 's1', title: 'Поток 1', status: 'enrollment', mentorId: 'mentor-1' },
  { uuid: 's2', title: 'Поток 2', status: 'active', mentorId: 'mentor-1' },
  {
    uuid: 's3',
    title: 'Поток 3',
    status: 'completed',
    mentorId: 'mentor-1',
  },
  { uuid: 's4', title: 'Поток 4', status: 'archived', mentorId: 'mentor-1' },
  {
    uuid: 's5',
    title: 'Чужой поток',
    status: 'active',
    mentorId: 'other-mentor',
  },
];

function setupStory() {
  const story = createStory();
  // Прямое присваивание — перезаписывает свойство после конструктора
  Object.assign(story, {
    appApi: {
      execute: async (_cmd: string) => mockStreams,
    },
  } as any);
  return story;
}

describe('MyStreamsStory', () => {
  test('handleStart возвращает null (нет своей кнопки)', async () => {
    const story = createStory();
    const item = await story.handleStart(mentorActor());
    expect(item).toBeNull();
  });

  test('handleCallback "list" показывает enrollment + active', async () => {
    const story = setupStory();
    const response = await story.handleCallback('list', mentorActor(), {
      activeHandler: null,
    });

    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('Мои потоки');

    // Названия потоков — в кнопках клавиатуры
    const rows = response.sendMessage?.keyboard?.rows ?? [];
    const allButtonTexts = rows.flat().map((b) => b.text);
    expect(allButtonTexts).toContain('🟡 Поток 1');
    expect(allButtonTexts).toContain('🔵 Поток 2');
    // Завершённые и архивированные не показываются по умолчанию
    expect(allButtonTexts).not.toContain('🟢 Поток 3');
    expect(allButtonTexts).not.toContain('⚫ Поток 4');
    // Чужой поток не показывается
    expect(allButtonTexts).not.toContain('Чужой поток');

    // Должны быть кнопки-переключатели
    expect(allButtonTexts).toContain('⚫ Вкл. архивированные');
    expect(allButtonTexts).toContain('🟢 Вкл. завершённые');
  });

  test('handleCallback "list:completed:1" показывает завершённые', async () => {
    const story = setupStory();
    const response = await story.handleCallback(
      'list:completed:1',
      mentorActor(),
      { activeHandler: null },
    );

    const rows = response.sendMessage?.keyboard?.rows ?? [];
    const allButtonTexts = rows.flat().map((b) => b.text);
    expect(allButtonTexts).toContain('🟢 Поток 3');
    expect(allButtonTexts).not.toContain('⚫ Поток 4');
  });

  test('handleCallback "list:archived:1" показывает архивированные', async () => {
    const story = setupStory();
    const response = await story.handleCallback(
      'list:archived:1',
      mentorActor(),
      { activeHandler: null },
    );

    const rows = response.sendMessage?.keyboard?.rows ?? [];
    const allButtonTexts = rows.flat().map((b) => b.text);
    expect(allButtonTexts).toContain('⚫ Поток 4');
    expect(allButtonTexts).not.toContain('🟢 Поток 3');
  });

  test('фильтрует только потоки текущего ментора', async () => {
    const story = setupStory();
    const response = await story.handleCallback('list', mentorActor(), {
      activeHandler: null,
    });

    const rows = response.sendMessage?.keyboard?.rows ?? [];
    const allButtonTexts = rows.flat().map((b) => b.text);
    expect(allButtonTexts).not.toContain('Чужой поток');
  });

  test('нет потоков — показывает сообщение', async () => {
    const story = createStory();
    (story as any).appApi = {
      execute: async () => [],
    };
    const response = await story.handleCallback('list', mentorActor(), {
      activeHandler: null,
    });

    expect(response.sendMessage?.text).toContain('У вас пока нет потоков');
  });

  test('ошибка API — показывает сообщение об ошибке', async () => {
    const story = createStory();
    (story as any).appApi = {
      execute: async () => {
        throw new Error('API error');
      },
    };
    const response = await story.handleCallback('list', mentorActor(), {
      activeHandler: null,
    });

    expect(response.sendMessage?.text).toContain('Не удалось загрузить');
  });

  test('handleMessage возвращает заглушку', async () => {
    const story = createStory();
    const response = await story.handleMessage(
      { type: 'message', text: 'что-то', telegramId: 123 },
      mentorActor(),
      { activeHandler: null },
    );
    expect(response.sendMessage?.text).toContain('Используйте кнопки');
  });
});
