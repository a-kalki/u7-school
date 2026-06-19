import { describe, expect, mock, test } from 'bun:test';
import type { U7BotApp, User } from '@u7-scl/app/domain';
import type { SessionData } from '@u7-scl/core/ui';
import { assertResponseMarkdownSafe } from '@u7-scl/core/ui';
import { Role } from '@u7-scl/user/domain';
import type { StreamApiModule } from 'packages/stream/src/api';
import { MonitorStory } from './monitor.story';

describe('MonitorStory', () => {
  const actor: User = {
    uuid: 'mentor-1',
    name: 'Ментор',
    telegramId: 123,
    roles: [Role.MENTOR],
    createdAt: '2026-01-01T00:00:00.000Z',
  };
  const session: SessionData = { activeHandler: null };

  test('handleCallback("students:<id>") показывает сводку и прогресс-бары в тексте', async () => {
    const moduleApi = {
      execute: mock((name: string) => {
        if (name === 'list-stream-students')
          return [
            {
              uuid: 'st1',
              userId: 'user-1',
              status: 'active',
              steps: [
                { stepId: 'step-1', status: 'completed' },
                { stepId: 'step-2', status: 'completed' },
              ],
            },
          ];
        if (name === 'get-stream')
          return {
            uuid: 's1',
            title: 'Поток',
            status: 'active',
            contentSnapshot: [
              {
                projectTitle: 'P1',
                lessons: [
                  {
                    lessonTitle: 'L1',
                    stepIds: ['step-1', 'step-2', 'step-3', 'step-4'],
                  },
                ],
              },
            ],
          };
        return undefined;
      }),
    } as unknown as StreamApiModule;
    const appApi = {
      execute: mock((name: string) => {
        if (name === 'get-user')
          return {
            uuid: 'user-1',
            name: 'Иван',
            telegramId: 111,
            roles: [Role.STUDENT],
          };
        return undefined;
      }),
    } as unknown as U7BotApp;

    const story = new MonitorStory();
    story.init(moduleApi, appApi);

    const response = await story.handleCallback('students:s1', actor, session);
    assertResponseMarkdownSafe(response);

    const text = response.sendMessage?.text ?? '';
    // Заголовок
    expect(text).toContain('Студенты потока');
    // Сводка
    expect(text).toContain('Всего:');
    expect(text).toContain('студент');
    // Прогресс-бар в тексте (▓/░)
    expect(text).toContain('▓');
    expect(text).toContain('░');
    // Проценты и счётчики в тексте (скобки экранированы для MarkdownV2)
    expect(text).toContain('50%');
    expect(text).toContain('2/4');
    // Имя в тексте
    expect(text).toContain('Иван');

    // Кнопки — компактные
    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btnTexts.some((t) => t.includes('👤'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Иван'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('50%'))).toBe(true);

    // Кнопка «⬅️ Назад к потоку»
    expect(btnTexts.some((t) => t.includes('⬅️ Назад к потоку'))).toBe(true);
  });

  test('handleStart возвращает null', async () => {
    const story = new MonitorStory();
    expect(await story.handleStart(actor)).toBeNull();
  });

  // ── US-8: Имена студентов и детальная карточка ──

  test('показывает имена студентов в тексте и кнопках, не показывает userId', async () => {
    const moduleApi = {
      execute: mock((name: string) => {
        if (name === 'list-stream-students')
          return [
            {
              uuid: 'st1',
              userId: 'user-1',
              status: 'active',
              steps: [{ stepId: 'step-1', status: 'completed' }],
            },
            {
              uuid: 'st2',
              userId: 'user-2',
              status: 'active',
              steps: [],
            },
          ];
        if (name === 'get-stream')
          return {
            uuid: 's1',
            title: 'Поток',
            status: 'active',
            contentSnapshot: [
              {
                projectTitle: 'P1',
                lessons: [{ lessonTitle: 'L1', stepIds: ['step-1'] }],
              },
            ],
          };
        return undefined;
      }),
    } as unknown as StreamApiModule;
    const appApi = {
      execute: mock((name: string, params: any) => {
        if (name === 'get-user' && params?.uuid === 'user-1')
          return {
            uuid: 'user-1',
            name: 'Иван Иванов',
            telegramId: 111,
            roles: [Role.STUDENT],
          };
        if (name === 'get-user' && params?.uuid === 'user-2')
          return {
            uuid: 'user-2',
            name: 'Петр Петров',
            telegramId: 222,
            roles: [Role.STUDENT],
          };
        return undefined;
      }),
    } as unknown as U7BotApp;

    const story = new MonitorStory();
    story.init(moduleApi, appApi);

    const response = await story.handleCallback('students:s1', actor, session);
    assertResponseMarkdownSafe(response);

    const text = response.sendMessage?.text ?? '';
    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];

    // Имена есть и в тексте, и в кнопках
    expect(text).toContain('Иван Иванов');
    expect(text).toContain('Петр Петров');
    expect(btnTexts.some((t) => t.includes('Иван Иванов'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Петр Петров'))).toBe(true);

    // userId НЕ отображается ни в тексте, ни в кнопках
    expect(text).not.toContain('user-1');
    expect(text).not.toContain('user-2');
    expect(btnTexts.some((t) => t.includes('user-'))).toBe(false);
  });

  test('клик на студента открывает детальную карточку', async () => {
    const studentRecord = {
      uuid: 'st1',
      streamId: 's-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s',
      userId: 'user-1',
      enrolledAt: '2026-01-01T00:00:00.000Z',
      status: 'active',
      currentStepId: 'step-2',
      steps: [
        {
          stepId: 'step-1',
          status: 'completed',
          issuedAt: '2026-01-02T00:00:00.000Z',
          completedAt: '2026-01-03T00:00:00.000Z',
        },
        {
          stepId: 'step-2',
          status: 'issued',
          issuedAt: '2026-01-04T00:00:00.000Z',
        },
      ],
      createdAt: '2026-01-01T00:00:00.000Z',
    };

    const moduleApi = {
      execute: mock((name: string, params: any) => {
        if (name === 'get-student-progress' && params?.studentId === 'st1')
          return studentRecord;
        if (name === 'get-stream')
          return {
            uuid: 's-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s',
            title: 'Python Advanced',
            status: 'active',
            mentorId: 'mentor-1',
            contentSnapshot: [
              {
                projectTitle: 'Основы',
                projectId: 'p1',
                lessons: [
                  {
                    lessonTitle: 'Переменные',
                    lessonId: 'l1',
                    stepIds: ['step-1', 'step-2'],
                  },
                ],
              },
            ],
          };
        return undefined;
      }),
    } as unknown as StreamApiModule;
    const appApi = {
      execute: mock((name: string) => {
        if (name === 'get-user')
          return {
            uuid: 'user-1',
            name: 'Иван Иванов',
            telegramId: 111,
            telegramUsername: 'ivanov',
            roles: [Role.STUDENT],
            createdAt: '2026-01-01T00:00:00.000Z',
          };
        return undefined;
      }),
    } as unknown as U7BotApp;

    const story = new MonitorStory();
    story.init(moduleApi, appApi);

    const response = await story.handleCallback('detail:st1', actor, session);
    assertResponseMarkdownSafe(response);

    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('Иван Иванов');
    expect(text).toContain('ID 111');
    expect(text).toContain('Переменные');
    expect(text).toContain('50');

    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btnTexts.some((t) => t.includes('Написать'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('История шагов'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Назад к списку'))).toBe(true);
  });
});
