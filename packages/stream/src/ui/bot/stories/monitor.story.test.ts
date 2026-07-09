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
              currentStepId: 'step-3',
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
    expect(text).toContain('Студенты потока');
    expect(text).toContain('Всего:');
    expect(text).toContain('студент');
    expect(text).toContain('█');
    expect(text).toContain('░');
    expect(text).toContain('50%');
    expect(text).toContain('2/4');
    expect(text).toContain('Иван');
    expect(text).toContain('p1:l1:s3');

    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btnTexts.some((t) => t.includes('👤'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Иван'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('50%'))).toBe(true);
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

    expect(text).toContain('Иван Иванов');
    expect(text).toContain('Петр Петров');
    expect(btnTexts.some((t) => t.includes('Иван Иванов'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Петр Петров'))).toBe(true);
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
    expect(text).toContain('Переменные');
    expect(text).toContain('50');

    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btnTexts.some((t) => t.includes('Написать'))).toBe(false);
    expect(btnTexts.some((t) => t.includes('История шагов'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Назад к списку'))).toBe(true);
  });

  test('кнопка «История шагов» возвращает заглушку «ещё не реализовано»', async () => {
    const moduleApi = {
      execute: mock(() => undefined),
    } as unknown as StreamApiModule;
    const appApi = {
      execute: mock(() => undefined),
    } as unknown as U7BotApp;

    const story = new MonitorStory();
    story.init(moduleApi, appApi);

    const response = await story.handleCallback('history:st1', actor, session);

    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('История шагов');
    expect(text).toContain('ещё не реализована');
    expect(text).toContain('скоро будет');
  });

  // ── Действия ментора: mark-abandoned ──

  test('кнопки действий ментора в карточке активного студента', async () => {
    const moduleApi = {
      execute: mock((name: string) => {
        if (name === 'get-student-progress')
          return {
            uuid: 'st1',
            streamId: 's1',
            userId: 'u1',
            status: 'active',
            currentStepId: 'step-1',
            steps: [],
          };
        if (name === 'get-stream')
          return {
            uuid: 's1',
            title: 'Поток',
            description: '',
            mentorId: 'mentor-1',
            moduleId: 'm1',
            startDate: '2026-01-01',
            status: 'active',
            contentSnapshot: [],
            createdAt: '2026-01-01',
          };
        return undefined;
      }),
    } as unknown as StreamApiModule;
    const appApi = {
      execute: mock((name: string) => {
        if (name === 'get-user') return { name: 'Студент' };
        return undefined;
      }),
    } as unknown as U7BotApp;

    const story = new MonitorStory();
    story.init(moduleApi, appApi);

    const response = await story.handleCallback('detail:st1', actor, session);

    const btnTexts =
      response.sendMessage?.keyboard?.rows
        .flat()
        .map((b: { text: string }) => b.text) ?? [];
    expect(btnTexts.some((t) => t.includes('Неактивен'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Завершить'))).toBe(true);
  });

  test('нажатие «⚠️ Неактивен» → запрос подтверждения', async () => {
    const moduleApi = {
      execute: mock((name: string) => {
        if (name === 'get-student-progress')
          return {
            uuid: 'st1',
            streamId: 's1',
            userId: 'u1',
            status: 'active',
            currentStepId: 'step-1',
            steps: [],
          };
        return undefined;
      }),
    } as unknown as StreamApiModule;
    const appApi = {
      execute: mock((name: string) => {
        if (name === 'get-user') return { name: 'Студент' };
        return undefined;
      }),
    } as unknown as U7BotApp;

    const story = new MonitorStory();
    story.init(moduleApi, appApi);

    const response = await story.handleCallback(
      'mark-abandoned:st1',
      actor,
      session,
    );

    expect(response.sendMessage?.text).toContain('неактивного');
    const btnTexts =
      response.sendMessage?.keyboard?.rows
        .flat()
        .map((b: { text: string }) => b.text) ?? [];
    expect(btnTexts.some((t) => t.includes('Да, неактивен'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Отмена'))).toBe(true);
  });

  test('подтверждение → вызов mark-abandoned', async () => {
    const moduleApi = {
      execute: mock((name: string) => {
        if (name === 'get-student-progress')
          return {
            uuid: 'st1',
            streamId: 's1',
            userId: 'u1',
            status: 'active',
            currentStepId: 'step-1',
            steps: [],
          };
        if (name === 'mark-abandoned') return undefined;
        return undefined;
      }),
    } as unknown as StreamApiModule;
    const appApi = {
      execute: mock((name: string) => {
        if (name === 'get-user') return { name: 'Студент' };
        return undefined;
      }),
    } as unknown as U7BotApp;

    const story = new MonitorStory();
    story.init(moduleApi, appApi);

    await story.handleCallback(
      'mark-abandoned-confirm:st1',
      actor,
      session,
    );

    expect(moduleApi.execute).toHaveBeenCalledWith(
      'mark-abandoned',
      { streamId: 's1', studentId: 'st1' },
      'mentor-1',
    );
  });

  test('«Отмена» → возврат к карточке студента', async () => {
    const moduleApi = {
      execute: mock((name: string) => {
        if (name === 'get-student-progress')
          return {
            uuid: 'st1',
            streamId: 's1',
            userId: 'u1',
            status: 'active',
            currentStepId: 'step-1',
            steps: [],
          };
        if (name === 'get-stream')
          return {
            uuid: 's1',
            title: 'Поток',
            description: '',
            mentorId: 'mentor-1',
            moduleId: 'm1',
            startDate: '2026-01-01',
            status: 'active',
            contentSnapshot: [],
            createdAt: '2026-01-01',
          };
        return undefined;
      }),
    } as unknown as StreamApiModule;
    const appApi = {
      execute: mock((name: string) => {
        if (name === 'get-user') return { name: 'Студент' };
        return undefined;
      }),
    } as unknown as U7BotApp;

    const story = new MonitorStory();
    story.init(moduleApi, appApi);

    const response = await story.handleCallback('detail:st1', actor, session);
    expect(response.sendMessage?.text).toContain('Студент');
  });

  // ── complete-student: выбор исхода + confirm ──

  test('нажатие «✅ Завершить» → выбор исхода', async () => {
    const response = await makeStory().handleCallback(
      'complete:st1',
      actor,
      session,
    );

    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('Выберите исход');

    const btnTexts =
      response.sendMessage?.keyboard?.rows
        .flat()
        .map((b: { text: string }) => b.text) ?? [];
    expect(btnTexts.some((t) => t.includes('Прошёл'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Не прошёл'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Выбыл'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Отмена'))).toBe(true);
  });

  test('выбор исхода «Прошёл» → confirm с исходом advanced', async () => {
    const story = makeStory();
    const response = await story.handleCallback(
      'complete-confirm:st1:advanced',
      actor,
      session,
    );

    expect(response.sendMessage?.text).toContain('прошёл');
    const confirmBtn =
      response.sendMessage?.keyboard?.rows[0]?.[0];
    expect(confirmBtn?.code).toContain(':advanced');
  });

  test('выбор исхода «Не прошёл» → confirm с исходом not_advanced', async () => {
    const story = makeStory();
    const response = await story.handleCallback(
      'complete-confirm:st1:not_advanced',
      actor,
      session,
    );

    expect(response.sendMessage?.text).toContain('не прошёл');
  });

  test('выбор исхода «Выбыл» → confirm с исходом abandoned', async () => {
    const story = makeStory();
    const response = await story.handleCallback(
      'complete-confirm:st1:abandoned',
      actor,
      session,
    );

    expect(response.sendMessage?.text).toContain('выбыл');
  });

  // ── Безопасность: кнопки действий только для ментора потока или админа ──

  test('студент НЕ видит кнопки «Неактивен» и «Завершить»', async () => {
    const studentActor: User = {
      uuid: 'student-1',
      name: 'Студент',
      telegramId: 999,
      roles: [Role.STUDENT],
      createdAt: '2026-01-01T00:00:00.000Z',
    };

    const moduleApi = {
      execute: mock((name: string) => {
        if (name === 'get-student-progress')
          return {
            uuid: 'st1',
            streamId: 's1',
            userId: 'u1',
            status: 'active',
            currentStepId: 'step-1',
            steps: [],
          };
        if (name === 'get-stream')
          return {
            uuid: 's1',
            title: 'Поток',
            description: '',
            mentorId: 'mentor-1',
            moduleId: 'm1',
            startDate: '2026-01-01',
            status: 'active',
            contentSnapshot: [],
            createdAt: '2026-01-01',
          };
        return undefined;
      }),
    } as unknown as StreamApiModule;
    const appApi = {
      execute: mock((name: string) => {
        if (name === 'get-user') return { name: 'Студент' };
        return undefined;
      }),
    } as unknown as U7BotApp;

    const story = new MonitorStory();
    story.init(moduleApi, appApi);

    const response = await story.handleCallback(
      'detail:st1',
      studentActor,
      session,
    );

    const btnTexts =
      response.sendMessage?.keyboard?.rows
        .flat()
        .map((b: { text: string }) => b.text) ?? [];
    expect(btnTexts.some((t) => t.includes('Неактивен'))).toBe(false);
    expect(btnTexts.some((t) => t.includes('Завершить'))).toBe(false);
  });

  test('чужой ментор НЕ видит кнопки «Неактивен» и «Завершить»', async () => {
    const otherMentor: User = {
      uuid: 'other-mentor',
      name: 'Чужой Ментор',
      telegramId: 888,
      roles: [Role.MENTOR],
      createdAt: '2026-01-01T00:00:00.000Z',
    };

    const moduleApi = {
      execute: mock((name: string) => {
        if (name === 'get-student-progress')
          return {
            uuid: 'st1',
            streamId: 's1',
            userId: 'u1',
            status: 'active',
            currentStepId: 'step-1',
            steps: [],
          };
        if (name === 'get-stream')
          return {
            uuid: 's1',
            title: 'Поток',
            description: '',
            mentorId: 'mentor-1',
            moduleId: 'm1',
            startDate: '2026-01-01',
            status: 'active',
            contentSnapshot: [],
            createdAt: '2026-01-01',
          };
        return undefined;
      }),
    } as unknown as StreamApiModule;
    const appApi = {
      execute: mock((name: string) => {
        if (name === 'get-user') return { name: 'Студент' };
        return undefined;
      }),
    } as unknown as U7BotApp;

    const story = new MonitorStory();
    story.init(moduleApi, appApi);

    const response = await story.handleCallback(
      'detail:st1',
      otherMentor,
      session,
    );

    const btnTexts =
      response.sendMessage?.keyboard?.rows
        .flat()
        .map((b: { text: string }) => b.text) ?? [];
    expect(btnTexts.some((t) => t.includes('Неактивен'))).toBe(false);
    expect(btnTexts.some((t) => t.includes('Завершить'))).toBe(false);
  });

  test('гость без ролей НЕ видит кнопки «Неактивен» и «Завершить»', async () => {
    const guestActor: User = {
      uuid: 'guest-1',
      name: 'Гость',
      telegramId: 777,
      roles: [],
      createdAt: '2026-01-01T00:00:00.000Z',
    };

    const moduleApi = {
      execute: mock((name: string) => {
        if (name === 'get-student-progress')
          return {
            uuid: 'st1',
            streamId: 's1',
            userId: 'u1',
            status: 'active',
            currentStepId: 'step-1',
            steps: [],
          };
        if (name === 'get-stream')
          return {
            uuid: 's1',
            title: 'Поток',
            description: '',
            mentorId: 'mentor-1',
            moduleId: 'm1',
            startDate: '2026-01-01',
            status: 'active',
            contentSnapshot: [],
            createdAt: '2026-01-01',
          };
        return undefined;
      }),
    } as unknown as StreamApiModule;
    const appApi = {
      execute: mock((name: string) => {
        if (name === 'get-user') return { name: 'Студент' };
        return undefined;
      }),
    } as unknown as U7BotApp;

    const story = new MonitorStory();
    story.init(moduleApi, appApi);

    const response = await story.handleCallback(
      'detail:st1',
      guestActor,
      session,
    );

    const btnTexts =
      response.sendMessage?.keyboard?.rows
        .flat()
        .map((b: { text: string }) => b.text) ?? [];
    expect(btnTexts.some((t) => t.includes('Неактивен'))).toBe(false);
    expect(btnTexts.some((t) => t.includes('Завершить'))).toBe(false);
  });

  test('админ видит кнопки «Неактивен» и «Завершить»', async () => {
    const adminActor: User = {
      uuid: 'admin-1',
      name: 'Админ',
      telegramId: 666,
      roles: [Role.ADMIN],
      createdAt: '2026-01-01T00:00:00.000Z',
    };

    const moduleApi = {
      execute: mock((name: string) => {
        if (name === 'get-student-progress')
          return {
            uuid: 'st1',
            streamId: 's1',
            userId: 'u1',
            status: 'active',
            currentStepId: 'step-1',
            steps: [],
          };
        if (name === 'get-stream')
          return {
            uuid: 's1',
            title: 'Поток',
            description: '',
            mentorId: 'mentor-1',
            moduleId: 'm1',
            startDate: '2026-01-01',
            status: 'active',
            contentSnapshot: [],
            createdAt: '2026-01-01',
          };
        return undefined;
      }),
    } as unknown as StreamApiModule;
    const appApi = {
      execute: mock((name: string) => {
        if (name === 'get-user') return { name: 'Студент' };
        return undefined;
      }),
    } as unknown as U7BotApp;

    const story = new MonitorStory();
    story.init(moduleApi, appApi);

    const response = await story.handleCallback(
      'detail:st1',
      adminActor,
      session,
    );

    const btnTexts =
      response.sendMessage?.keyboard?.rows
        .flat()
        .map((b: { text: string }) => b.text) ?? [];
    expect(btnTexts.some((t) => t.includes('Неактивен'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Завершить'))).toBe(true);
  });
});

/** Вспомогательная функция для создания MonitorStory с моками */
function makeStory() {
  const moduleApi = {
    execute: mock((name: string) => {
      if (name === 'get-student-progress')
        return {
          uuid: 'st1',
          streamId: 's1',
          userId: 'u1',
          status: 'active',
          currentStepId: 'step-1',
          steps: [],
        };
      return undefined;
    }),
  } as unknown as StreamApiModule;
  const appApi = {
    execute: mock((name: string) => {
      if (name === 'get-user') return { name: 'Студент' };
      return undefined;
    }),
  } as unknown as U7BotApp;

  const story = new MonitorStory();
  story.init(moduleApi, appApi);
  return story;
}
