import { describe, expect, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import type { Stream } from '@u7-scl/stream/domain';
import { StreamStatus } from '@u7-scl/stream/domain';
import { Role } from '@u7-scl/user/domain';
import { ViewStreamMentorStory } from './view-stream-mentor';

function createStory(): ViewStreamMentorStory {
  const story = new ViewStreamMentorStory();
  Object.assign(story, {
    appApi: {
      execute: async (_cmd: string, _params?: Record<string, unknown>) => {
        if (_cmd === 'get-stream') return mockStream;
        if (_cmd === 'list-stream-students') return [];
        if (_cmd === 'get-user')
          return { name: 'Ментор Тест', roles: [Role.MENTOR] };
        return {};
      },
    },
  } as any);
  return story;
}

const mentorActor: User = {
  uuid: 'mentor-1',
  name: 'Ментор',
  telegramId: 123,
  roles: [Role.MENTOR],
  createdAt: '2026-01-01T00:00:00.000Z',
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

describe('ViewStreamMentorStory', () => {
  test('handleStart возвращает null (нет своей кнопки)', async () => {
    const story = createStory();
    expect(await story.handleStart(mentorActor)).toBeNull();
  });

  test('handleCallback "view" показывает карточку', async () => {
    const story = createStory();
    const response = await story.handleCallback('view:stream-1', mentorActor, {
      activeHandler: null,
    });
    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('Тестовый поток');
  });

  test('handleCallback "view" добавляет lifecycle-кнопки для enrollment', async () => {
    const story = createStory();
    const response = await story.handleCallback('view:stream-1', mentorActor, {
      activeHandler: null,
    });
    const rows = response.sendMessage?.keyboard?.rows ?? [];
    const allTexts = rows.flat().map((b) => b.text);

    // Публичные кнопки
    expect(allTexts).toContain('📖 Программа курса');
    expect(allTexts).toContain('👥 Студенты');
    expect(allTexts).toContain('📋 Детали');
    // Lifecycle: enrolment → «Запустить»
    expect(allTexts).toContain('🚀 Запустить');
    // Кнопка «Назад к моим потокам»
    expect(allTexts).toContain('⬅️ Назад к моим потокам');
  });

  test('handleCallback "view" для active показывает «Завершить»', async () => {
    const story = createStory();
    // Мокируем active stream
    Object.assign(story, {
      appApi: {
        execute: async (_cmd: string, _params?: Record<string, unknown>) => {
          if (_cmd === 'get-stream')
            return { ...mockStream, status: StreamStatus.ACTIVE };
          if (_cmd === 'list-stream-students') return [];
          if (_cmd === 'get-user')
            return { name: 'Ментор Тест', roles: [Role.MENTOR] };
          return {};
        },
      },
    } as any);

    const response = await story.handleCallback('view:stream-1', mentorActor, {
      activeHandler: null,
    });
    const rows = response.sendMessage?.keyboard?.rows ?? [];
    const allTexts = rows.flat().map((b) => b.text);
    expect(allTexts).toContain('✅ Завершить');
    expect(allTexts).not.toContain('🚀 Запустить');
  });

  test('handleCallback "program" показывает программу', async () => {
    const story = createStory();
    const response = await story.handleCallback(
      'program:stream-1',
      mentorActor,
      { activeHandler: null },
    );
    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('Программа курса');
    expect(text).toContain('Проект 1');
    expect(text).toContain('Урок 1');
  });

  test('handleCallback "details" показывает детали', async () => {
    const story = createStory();
    Object.assign(story, {
      appApi: {
        execute: async (_cmd: string, _params?: Record<string, unknown>) => {
          if (_cmd === 'get-stream')
            return {
              ...mockStream,
              goal: 'Научиться',
              result: 'Сможете',
            };
          return {};
        },
      },
    } as any);

    const response = await story.handleCallback(
      'details:stream-1',
      mentorActor,
      { activeHandler: null },
    );
    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('Детали');
    expect(text).toContain('Научиться');
  });

  test('handleCallback "complete" показывает подтверждение', async () => {
    const story = createStory();
    const response = await story.handleCallback(
      'complete:stream-1',
      mentorActor,
      { activeHandler: null },
    );
    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('Завершить поток');
  });

  test('handleMessage возвращает заглушку', async () => {
    const story = createStory();
    const response = await story.handleMessage();
    expect(response.sendMessage?.text).toContain('Неизвестное сообщение');
  });

  // ── handleCallback: делегирует students родителю ──

  test('handleCallback "students" делегирует родителю (ViewStreamStory)', async () => {
    const story = createStory();
    // Переопределяем мок чтобы handleStudentsList получил студентов
    Object.assign(story, {
      appApi: {
        execute: async (_cmd: string, _params?: Record<string, unknown>) => {
          if (_cmd === 'get-stream')
            return { ...mockStream, status: StreamStatus.ACTIVE };
          if (_cmd === 'list-stream-students')
            return [
              {
                uuid: 'student-1',
                userId: 'user-id-1',
                status: 'active',
                joinedAt: '2026-01-01T00:00:00.000Z',
                streamId: 'stream-1',
                currentStepId: null,
                steps: [],
              },
            ];
          if (_cmd === 'get-user')
            return { name: 'Студент Один', roles: [Role.STUDENT] };
          return {};
        },
      },
    } as any);

    const response = await story.handleCallback(
      'students:stream-1',
      mentorActor,
      { activeHandler: null },
    );
    const text = response.sendMessage?.text ?? '';
    // Должен показать список студентов (делегировано родителю)
    expect(text).toContain('Студенты потока');
    expect(text).toContain('Студент Один');
  });

  // ── handleStudentsList: менторский режим ──

  test('handleStudentsList: кнопка студента ведёт в monitor (не view-stream)', async () => {
    const story = createStory();
    Object.assign(story, {
      appApi: {
        execute: async (_cmd: string, _params?: Record<string, unknown>) => {
          if (_cmd === 'get-stream')
            return { ...mockStream, status: StreamStatus.ACTIVE };
          if (_cmd === 'list-stream-students')
            return [
              {
                uuid: 'student-1',
                userId: 'user-id-1',
                status: 'active',
                joinedAt: '2026-01-01T00:00:00.000Z',
                streamId: 'stream-1',
                currentStepId: null,
                steps: [],
              },
            ];
          if (_cmd === 'get-user')
            return { name: 'Студент Один', roles: [Role.STUDENT] };
          return {};
        },
      },
    } as any);

    const response = await story.handleCallback(
      'students:stream-1',
      mentorActor,
      { activeHandler: null },
    );

    const allCodes =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.code) ?? [];

    // Кнопка студента должна вести в monitor (менторский режим)
    const hasMonitorDetail = allCodes.some((c) =>
      c.startsWith('monitor:detail:'),
    );
    const hasViewStreamDetail = allCodes.some((c) =>
      c.startsWith('view-stream:detail:'),
    );
    expect(hasMonitorDetail).toBe(true);
    expect(hasViewStreamDetail).toBe(false);
  });

  test('handleStudentsList: содержит менторские кнопки (⛔✅) для активных', async () => {
    const story = createStory();
    Object.assign(story, {
      appApi: {
        execute: async (_cmd: string, _params?: Record<string, unknown>) => {
          if (_cmd === 'get-stream')
            return { ...mockStream, status: StreamStatus.ACTIVE };
          if (_cmd === 'list-stream-students')
            return [
              {
                uuid: 'student-1',
                userId: 'user-id-1',
                status: 'active',
                joinedAt: '2026-01-01T00:00:00.000Z',
                streamId: 'stream-1',
                currentStepId: null,
                steps: [],
              },
            ];
          if (_cmd === 'get-user')
            return { name: 'Студент Один', roles: [Role.STUDENT] };
          return {};
        },
      },
    } as any);

    const response = await story.handleCallback(
      'students:stream-1',
      mentorActor,
      { activeHandler: null },
    );

    const allTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    const allCodes =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.code) ?? [];

    // Должны быть кнопки ⛔ и ✅ для активного студента
    expect(allTexts).toContain('⛔');
    expect(allTexts).toContain('✅');

    // Кнопка ⛔ должна вести в monitor:mark-abandoned
    const abandonBtn = allCodes.find((_, i) => allTexts[i] === '⛔');
    expect(abandonBtn).toStartWith('monitor:mark-abandoned:');

    // Кнопка ✅ должна вести в monitor:complete
    const completeBtn = allCodes.find((_, i) => allTexts[i] === '✅');
    expect(completeBtn).toStartWith('monitor:complete:');
  });
});
