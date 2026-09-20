import { describe, expect, mock, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import type { BotSession, DialogResponse } from '@u7-scl/core/ui';
import { assertDialogResponseMarkdownSafe } from '@u7-scl/core/ui';
import type { Stream } from '@u7-scl/stream/domain';
import { StreamStatus } from '@u7-scl/stream/domain';
import { Role } from '@u7-scl/user/domain';
import { ViewStreamMentorStory } from './view-stream-mentor';

const mentorActor: User = {
  uuid: 'mentor-1',
  name: 'Ментор',
  telegramId: 123,
  roles: [Role.MENTOR],
  createdAt: '2026-01-01T00:00:00.000Z',
};

const session: BotSession = {
  dialog: { path: 'mentor/view-stream-mentor', seq: 2 },
};

const mockStream = {
  uuid: 'stream-1',
  title: 'Тестовый поток',
  description: 'Описание потока',
  status: StreamStatus.ENROLLMENT,
  mentorId: 'mentor-1',
  moduleId: 'module-1',
  startDate: '2026-06-01T10:00:00.000Z',
  contentSnapshot: [
    {
      projectTitle: 'Проект 1',
      lessons: [
        {
          lessonId: 'lesson-1',
          lessonTitle: 'Урок 1',
          stepIds: ['step-1', 'step-2'],
        },
      ],
    },
  ],
} as Stream;

const mockStudent = {
  uuid: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0001',
  userId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  enrolledAt: '2026-01-01T00:00',
  status: 'active',
  streamId: '11111111-1111-4111-8111-111111111111',
  currentStepId: 'cccc0000-0000-4000-8000-000000000001',
  steps: [],
  createdAt: '2026-01-01T00:00',
};

type Handler = (name: string, params?: Record<string, unknown>) => unknown;

function createStory(handler?: Handler) {
  const story = new ViewStreamMentorStory();
  const appApi = {
    execute: mock(async (name: string, params?: Record<string, unknown>) => {
      if (handler) return handler(name, params);
      if (name === 'get-stream') return mockStream;
      if (name === 'list-stream-students') return [];
      if (name === 'get-user') return { name: 'Ментор Тест', roles: [] };
      return undefined;
    }),
  };
  story.init({ appApi } as never);
  return { story, appApi };
}

function flat(response: DialogResponse) {
  const rows = response.screen?.keyboard?.rows ?? [];
  return {
    rows,
    texts: rows.flat().map((b) => b.text),
    codes: rows.flat().map((b) => b.code),
  };
}

describe('ViewStreamMentorStory (S02m-карточка) — контракт «Диалог и Экран»', () => {
  test('menuButtons: пусто (вход только через «Мои потоки»)', async () => {
    const { story } = createStory();
    expect(await story.menuButtons(mentorActor)).toEqual([]);
  });

  // ── view: карточка + lifecycle-клавиатура ──

  test('view: карточка потока, enrollment — «🚀 Запустить» и точные коды', async () => {
    const { story } = createStory();
    const response = await story.handleCallback(
      'view:stream-1',
      mentorActor,
      session,
    );
    assertDialogResponseMarkdownSafe(response);

    expect(String(response.screen?.text)).toContain('Тестовый поток');
    const { texts, codes } = flat(response);
    // Публичные кнопки (инвентаризация)
    expect(texts).toEqual([
      '📖 Программа курса',
      '📋 Детали',
      '👥 Студенты',
      '🚀 Запустить',
      '⬅️ Назад к моим потокам',
    ]);
    expect(codes).toContain('view-stream-mentor:program:stream-1');
    // Студенты — мост в monitor (менторский список)
    expect(codes).toContain('monitor:students:stream-1');
    expect(codes).toContain('view-stream-mentor:details:stream-1');
    expect(codes).toContain('activate-stream:activate:stream-1');
    expect(codes).toContain('my-streams:list');
  });

  test('view: active — «✅ Завершить» вместо «Запустить»', async () => {
    const { story } = createStory((name) => {
      if (name === 'get-stream')
        return { ...mockStream, status: StreamStatus.ACTIVE };
      if (name === 'list-stream-students') return [];
      if (name === 'get-user') return { name: 'Ментор Тест', roles: [] };
      return undefined;
    });
    const response = await story.handleCallback(
      'view:stream-1',
      mentorActor,
      session,
    );
    const { texts, codes } = flat(response);
    expect(texts).toContain('✅ Завершить');
    expect(texts).not.toContain('🚀 Запустить');
    expect(codes).toContain('view-stream-mentor:complete:stream-1');
  });

  test('view: completed — «📁 В архив»', async () => {
    const { story } = createStory((name) => {
      if (name === 'get-stream')
        return { ...mockStream, status: StreamStatus.COMPLETED };
      if (name === 'list-stream-students') return [];
      if (name === 'get-user') return { name: 'Ментор Тест', roles: [] };
      return undefined;
    });
    const response = await story.handleCallback(
      'view:stream-1',
      mentorActor,
      session,
    );
    const { texts, codes } = flat(response);
    expect(texts).toContain('📁 В архив');
    expect(codes).toContain('view-stream-mentor:archive:stream-1');
  });

  // ── program / details: родительский текст, назад — на свою view ──

  test('program: программа курса, назад в view-stream-mentor', async () => {
    const { story } = createStory();
    const response = await story.handleCallback(
      'program:stream-1',
      mentorActor,
      session,
    );
    assertDialogResponseMarkdownSafe(response);
    const text = String(response.screen?.text);
    expect(text).toContain('Программа курса');
    expect(text).toContain('Проект 1');
    expect(text).toContain('Урок 1');
    expect(flat(response).codes).toContain('view-stream-mentor:view:stream-1');
  });

  test('details: показывает заполненные поля', async () => {
    const { story } = createStory((name) => {
      if (name === 'get-stream')
        return { ...mockStream, goal: 'Научиться', result: 'Сможете' };
      if (name === 'get-user') return { name: 'Ментор Тест', roles: [] };
      return undefined;
    });
    const response = await story.handleCallback(
      'details:stream-1',
      mentorActor,
      session,
    );
    const text = String(response.screen?.text);
    expect(text).toContain('Детали');
    expect(text).toContain('Научиться');
  });

  // ── students: менторский режим списка ──

  test('students: кнопка студента — monitor:detail + менторские ⛔✅', async () => {
    const { story } = createStory((name) => {
      if (name === 'get-stream')
        return { ...mockStream, status: StreamStatus.ACTIVE };
      if (name === 'list-stream-students') return [mockStudent];
      if (name === 'get-user')
        return { uuid: 'user-id-1', name: 'Студент Один', roles: [] };
      return undefined;
    });
    const response = await story.handleCallback(
      'students:stream-1',
      mentorActor,
      session,
    );
    assertDialogResponseMarkdownSafe(response);

    const text = String(response.screen?.text);
    expect(text).toContain('Студенты потока');
    expect(text).toContain('Студент Один');

    const { texts, codes } = flat(response);
    // Кнопка студента ведёт в monitor (менторский режим)
    expect(codes).toContain(
      'monitor:detail:aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0001',
    );
    // Менторские кнопки с точными кодами
    expect(codes).toContain(
      'monitor:mark-abandoned:aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0001',
    );
    expect(codes).toContain(
      'monitor:complete:aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0001',
    );
    expect(texts).toContain('⛔');
    expect(texts).toContain('✅');
    // Назад к потоку — на свою view
    expect(codes).toContain('view-stream-mentor:view:stream-1');
  });

  test('students: advanced — только 🔄 (повтор), без ⛔', async () => {
    const { story } = createStory((name) => {
      if (name === 'get-stream')
        return { ...mockStream, status: StreamStatus.ACTIVE };
      if (name === 'list-stream-students')
        return [{ ...mockStudent, status: 'advanced' }];
      if (name === 'get-user')
        return { uuid: 'user-id-1', name: 'Прошёл Студент', roles: [] };
      return undefined;
    });
    const response = await story.handleCallback(
      'students:stream-1',
      mentorActor,
      session,
    );
    const { texts, codes } = flat(response);
    expect(codes).toContain(
      'monitor:complete:aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0001',
    );
    expect(texts).toContain('🔄');
    expect(codes.some((c) => c.includes('mark-abandoned'))).toBe(false);
  });

  test('students: не-owner ментор — без менторских кнопок', async () => {
    const { story } = createStory((name) => {
      if (name === 'get-stream')
        return { ...mockStream, status: StreamStatus.ACTIVE, mentorId: 'x' };
      if (name === 'list-stream-students') return [mockStudent];
      if (name === 'get-user')
        return { uuid: 'user-id-1', name: 'Студент Один', roles: [] };
      return undefined;
    });
    const response = await story.handleCallback(
      'students:stream-1',
      mentorActor,
      session,
    );
    const { texts } = flat(response);
    expect(texts).not.toContain('⛔');
    expect(texts).not.toContain('✅');
  });

  // ── complete: confirm → выполнение ──

  test('complete: confirm-экран с точными кнопками', async () => {
    const { story } = createStory();
    const response = await story.handleCallback(
      'complete:stream-1',
      mentorActor,
      session,
    );
    assertDialogResponseMarkdownSafe(response);
    expect(String(response.screen?.text)).toContain('Завершить поток');
    expect(response.screen?.keyboard?.rows).toEqual([
      [
        {
          text: '✅ Да, завершить',
          code: 'view-stream-mentor:complete-confirm:stream-1',
        },
        { text: '❌ Отмена', code: 'view-stream-mentor:view:stream-1' },
      ],
    ]);
  });

  test('complete-confirm: UC complete-stream, экран успеха с кнопкой назад', async () => {
    const { story, appApi } = createStory();
    const response = await story.handleCallback(
      'complete-confirm:stream-1',
      mentorActor,
      session,
    );
    const calls = appApi.execute.mock.calls as unknown[][];
    expect(calls.find((c) => c[0] === 'complete-stream')?.[1]).toEqual({
      streamId: 'stream-1',
    });
    expect(String(response.screen?.text)).toContain('Поток завершён');
    expect(response.screen?.keyboard?.rows).toEqual([
      [{ text: '⬅️ Назад к списку', code: 'my-streams:list' }],
    ]);
  });

  // ── archive: confirm → выполнение ──

  test('archive: confirm-экран с точными кнопками', async () => {
    const { story } = createStory();
    const response = await story.handleCallback(
      'archive:stream-1',
      mentorActor,
      session,
    );
    assertDialogResponseMarkdownSafe(response);
    expect(String(response.screen?.text)).toContain('в архив');
    expect(response.screen?.keyboard?.rows).toEqual([
      [
        {
          text: '✅ Да, в архив',
          code: 'view-stream-mentor:archive-confirm:stream-1',
        },
        { text: '❌ Отмена', code: 'view-stream-mentor:view:stream-1' },
      ],
    ]);
  });

  test('archive-confirm: UC archive-stream, экран успеха с кнопкой назад', async () => {
    const { story, appApi } = createStory();
    const response = await story.handleCallback(
      'archive-confirm:stream-1',
      mentorActor,
      session,
    );
    const calls = appApi.execute.mock.calls as unknown[][];
    expect(calls.find((c) => c[0] === 'archive-stream')?.[1]).toEqual({
      streamId: 'stream-1',
    });
    expect(String(response.screen?.text)).toContain('архив');
    expect(response.screen?.keyboard?.rows).toEqual([
      [{ text: '⬅️ Назад к списку', code: 'my-streams:list' }],
    ]);
  });

  // ── Неизвестные действия ──

  test('неизвестная команда — экран «Неизвестная команда»', async () => {
    const { story } = createStory();
    const response = await story.handleCallback(
      'bogus:1',
      mentorActor,
      session,
    );
    expect(String(response.screen?.text)).toContain('Неизвестная');
  });

  test('handleMessage: дефолт ядра — реплика-отказ + release', async () => {
    const { story } = createStory();
    const response = await story.handleMessage(
      { type: 'message', text: 'что-то', telegramId: 123 },
      mentorActor,
      session,
    );
    expect(String(response.notify?.text)).toContain('не принимаются');
    expect(response.release).toBe(true);
  });
});
