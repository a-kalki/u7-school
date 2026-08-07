import { describe, expect, mock, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import type { U7BotApp } from '@u7-scl/bot/u7-bot-app-meta';
import type { SessionData } from '@u7-scl/core/ui';
import { assertResponseMarkdownSafe } from '@u7-scl/core/ui';
import { Role } from '@u7-scl/user/domain';
import type { U7BotApp } from '@u7-scl/bot/u7-bot-app-meta';
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

  test('handleCallback("students:<id>") показывает сводку и студентов кнопками-строками', async () => {
    const appApi = {
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
            mentorId: 'mentor-1',
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
    } as unknown as U7BotApp;
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
    expect(text).toContain('Всего: 1');
    expect(text).toContain('студент');
    // Сводка: один студент active → 🏃 В процессе: 1
    expect(text).toContain('🏃 В процессе');

    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    // Имя в кнопке с маркером и прогрессом
    expect(
      btnTexts.some(
        (t) => t.includes('🏃') && t.includes('Иван') && t.includes('50%'),
      ),
    ).toBe(true);
    // Кнопки действий для active студента (только эмодзи)
    expect(btnTexts.some((t) => t === '⛔')).toBe(true);
    expect(btnTexts.some((t) => t === '✅')).toBe(true);
    expect(btnTexts.some((t) => t.includes('⬅️ Назад к потоку'))).toBe(true);
  });

  // ── US-8: Имена студентов и детальная карточка ──

  test('показывает имена студентов в кнопках, не показывает userId', async () => {
    const appApi = {
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
    } as unknown as U7BotApp;
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

    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];

    expect(btnTexts.some((t) => t.includes('Иван Иванов'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Петр Петров'))).toBe(true);
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

    const appApi = {
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
    } as unknown as U7BotApp;
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
    expect(btnTexts.some((t) => t.includes('Назад к списку'))).toBe(true);
  });

  test('кнопка «История шагов» возвращает заглушку «ещё не реализовано»', async () => {
    const appApi = {
      execute: mock(() => undefined),
    } as unknown as U7BotApp;
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
    const appApi = {
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
    } as unknown as U7BotApp;
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
    // S08 больше не содержит кнопок действий (они теперь в S07)
    expect(btnTexts.some((t) => t === '⛔')).toBe(false);
    expect(btnTexts.some((t) => t === '✅')).toBe(false);
    expect(btnTexts.some((t) => t === '🔄')).toBe(false);
    // S08: только кнопка «Назад к списку»
    expect(btnTexts.some((t) => t.includes('Назад к списку'))).toBe(true);
  });

  test('нажатие 🛑 → запрос подтверждения', async () => {
    const appApi = {
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
    } as unknown as U7BotApp;
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
    const appApi = {
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
    } as unknown as U7BotApp;
    const appApi = {
      execute: mock((name: string) => {
        if (name === 'get-user') return { name: 'Студент' };
        return undefined;
      }),
    } as unknown as U7BotApp;

    const story = new MonitorStory();
    story.init(moduleApi, appApi);

    await story.handleCallback('mark-abandoned-confirm:st1', actor, session);

    expect(moduleApi.execute).toHaveBeenCalledWith(
      'mark-abandoned',
      { streamId: 's1', studentId: 'st1', cause: 'inactivity' },
      'mentor-1',
    );
  });

  test('«Отмена» → возврат к карточке студента', async () => {
    const appApi = {
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
    } as unknown as U7BotApp;
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

  test('нажатие ✅ → выбор исхода', async () => {
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
    const confirmBtn = response.sendMessage?.keyboard?.rows[0]?.[0];
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

  // ── complete-student: выполнение UC (регрессия зацикливания) ──

  test('confirm-диалог генерирует кнопку complete-confirm-confirm (не зацикливается)', async () => {
    const story = makeStory();
    const response = await story.handleCallback(
      'complete-confirm:st1:advanced',
      actor,
      session,
    );

    const confirmBtn = response.sendMessage?.keyboard?.rows[0]?.[0];
    // Кнопка подтверждения должна вести на execute, а не обратно на confirm-диалог
    expect(confirmBtn?.code).toContain('complete-confirm-confirm:st1:advanced');
  });

  test('подтверждение → вызов complete-student с исходом advanced', async () => {
    const appApi = {
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
        if (name === 'complete-student') return undefined;
        return undefined;
      }),
    } as unknown as U7BotApp;
    const appApi = {
      execute: mock(() => ({ name: 'Студент' })),
    } as unknown as U7BotApp;

    const story = new MonitorStory();
    story.init(moduleApi, appApi);

    const response = await story.handleCallback(
      'complete-confirm-confirm:st1:advanced',
      actor,
      session,
    );

    expect(moduleApi.execute).toHaveBeenCalledWith(
      'complete-student',
      { streamId: 's1', studentId: 'st1', outcome: 'advanced' },
      'mentor-1',
    );
    expect(response.sendMessage?.text).toContain('завершён');
    expect(response.delegate?.path).toContain('students:s1');
  });

  test('подтверждение → вызов complete-student с исходом abandoned', async () => {
    const appApi = {
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
        if (name === 'complete-student') return undefined;
        return undefined;
      }),
    } as unknown as U7BotApp;
    const appApi = {
      execute: mock(() => ({ name: 'Студент' })),
    } as unknown as U7BotApp;

    const story = new MonitorStory();
    story.init(moduleApi, appApi);

    await story.handleCallback(
      'complete-confirm-confirm:st1:abandoned',
      actor,
      session,
    );

    expect(moduleApi.execute).toHaveBeenCalledWith(
      'complete-student',
      { streamId: 's1', studentId: 'st1', outcome: 'abandoned' },
      'mentor-1',
    );
  });

  // ── Безопасность: кнопки действий только для ментора потока или админа ──

  test('студент НЕ видит кнопки ⛔ и ✅', async () => {
    const studentActor: User = {
      uuid: 'student-1',
      name: 'Студент',
      telegramId: 999,
      roles: [Role.STUDENT],
      createdAt: '2026-01-01T00:00:00.000Z',
    };

    const appApi = {
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
    } as unknown as U7BotApp;
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
    expect(btnTexts.some((t) => t === '⛔')).toBe(false);
    expect(btnTexts.some((t) => t === '✅')).toBe(false);
  });

  test('чужой ментор НЕ видит кнопки ⛔ и ✅', async () => {
    const otherMentor: User = {
      uuid: 'other-mentor',
      name: 'Чужой Ментор',
      telegramId: 888,
      roles: [Role.MENTOR],
      createdAt: '2026-01-01T00:00:00.000Z',
    };

    const appApi = {
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
    } as unknown as U7BotApp;
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
    expect(btnTexts.some((t) => t === '⛔')).toBe(false);
    expect(btnTexts.some((t) => t === '✅')).toBe(false);
  });

  test('гость без ролей НЕ видит кнопки ⛔ и ✅', async () => {
    const guestActor: User = {
      uuid: 'guest-1',
      name: 'Гость',
      telegramId: 777,
      roles: [],
      createdAt: '2026-01-01T00:00:00.000Z',
    };

    const appApi = {
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
    } as unknown as U7BotApp;
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
    expect(btnTexts.some((t) => t === '⛔')).toBe(false);
    expect(btnTexts.some((t) => t === '✅')).toBe(false);
  });

  test('админ видит кнопки ⛔ и ✅', async () => {
    const adminActor: User = {
      uuid: 'admin-1',
      name: 'Админ',
      telegramId: 666,
      roles: [Role.ADMIN],
      createdAt: '2026-01-01T00:00:00.000Z',
    };

    const appApi = {
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
    } as unknown as U7BotApp;
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
    // S08: кнопок действий нет даже для ADMIN
    expect(btnTexts.some((t) => t === '⛔')).toBe(false);
    expect(btnTexts.some((t) => t === '✅')).toBe(false);
    expect(btnTexts.some((t) => t.includes('Назад к списку'))).toBe(true);
  });

  // ── Фаза 4: Прозрачность — S07/S08 доступны GUEST/CANDIDATE ──

  test('GUEST видит S07 — список студентов в кнопках', async () => {
    const guestActor: User = {
      uuid: 'guest-s07',
      name: 'Гость',
      telegramId: 777,
      roles: [],
      createdAt: '2026-01-01T00:00:00.000Z',
    };

    const appApi = {
      execute: mock((name: string) => {
        if (name === 'list-stream-students')
          return [
            {
              uuid: 'st1',
              userId: 'user-1',
              currentStepId: 'step-2',
              status: 'active',
              steps: [{ stepId: 'step-1', status: 'completed' }],
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
                lessons: [{ lessonTitle: 'L1', stepIds: ['step-1', 'step-2'] }],
              },
            ],
          };
        return undefined;
      }),
    } as unknown as U7BotApp;
    const appApi = {
      execute: mock(() => ({ uuid: 'user-1', name: 'Иван' })),
    } as unknown as U7BotApp;

    const story = new MonitorStory();
    story.init(moduleApi, appApi);

    const response = await story.handleCallback(
      'students:s1',
      guestActor,
      session,
    );
    assertResponseMarkdownSafe(response);

    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('Студенты потока');
    expect(text).toContain('Всего: 1');
    expect(text).toContain('🏃 В процессе');

    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    // Гость видит студента в кнопке с прогрессом
    expect(btnTexts.some((t) => t.includes('Иван') && t.includes('50%'))).toBe(
      true,
    );
    // Гость НЕ видит кнопок действий
    expect(btnTexts.some((t) => t === '⛔')).toBe(false);
    expect(btnTexts.some((t) => t === '✅')).toBe(false);
    expect(btnTexts.some((t) => t.includes('⬅️ Назад к потоку'))).toBe(true);
  });

  test('CANDIDATE видит S07 — список студентов', async () => {
    const candidateActor: User = {
      uuid: 'cand-1',
      name: 'Кандидат',
      telegramId: 555,
      roles: [Role.CANDIDATE],
      createdAt: '2026-01-01T00:00:00.000Z',
    };

    const appApi = {
      execute: mock((name: string) => {
        if (name === 'list-stream-students')
          return [
            {
              uuid: 'st1',
              userId: 'user-1',
              currentStepId: 'step-1',
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
    } as unknown as U7BotApp;
    const appApi = {
      execute: mock(() => ({ uuid: 'user-1', name: 'Петя' })),
    } as unknown as U7BotApp;

    const story = new MonitorStory();
    story.init(moduleApi, appApi);

    const response = await story.handleCallback(
      'students:s1',
      candidateActor,
      session,
    );
    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('Студенты потока');

    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btnTexts.some((t) => t.includes('Петя'))).toBe(true);
    // Кандидат не видит кнопок действий
    expect(btnTexts.some((t) => t === '⛔')).toBe(false);
  });

  test('S07 показывает студентов с разными статусами и правильными маркерами', async () => {
    const appApi = {
      execute: mock((name: string) => {
        if (name === 'list-stream-students')
          return [
            { uuid: 'st1', userId: 'u1', status: 'active', steps: [] },
            { uuid: 'st2', userId: 'u2', status: 'advanced', steps: [] },
            { uuid: 'st3', userId: 'u3', status: 'not_advanced', steps: [] },
            { uuid: 'st4', userId: 'u4', status: 'abandoned', steps: [] },
          ];
        if (name === 'get-stream')
          return {
            uuid: 's1',
            title: 'Поток',
            status: 'active',
            mentorId: 'mentor-1',
            contentSnapshot: [
              {
                projectTitle: 'P1',
                lessons: [{ lessonTitle: 'L1', stepIds: ['step-1'] }],
              },
            ],
          };
        return undefined;
      }),
    } as unknown as U7BotApp;
    const appApi = {
      execute: mock((_name: string, params: any) => {
        const names: Record<string, string> = {
          u1: 'Активный',
          u2: 'Прошедший',
          u3: 'НеПрошедший',
          u4: 'Выбывший',
        };
        return { uuid: params?.uuid, name: names[params?.uuid] ?? '??' };
      }),
    } as unknown as U7BotApp;

    const story = new MonitorStory();
    story.init(moduleApi, appApi);

    const response = await story.handleCallback('students:s1', actor, session);
    assertResponseMarkdownSafe(response);

    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('Всего: 4');
    // Раздельные счётчики по статусам
    expect(text).toContain('🏃 В процессе: 1');
    expect(text).toContain('✅ Прошли: 1');
    expect(text).toContain('↩️ Не прошли: 1');
    expect(text).toContain('🚫 Выбыли: 1');
    // Легенда
    expect(text).toContain('🏃 учится');

    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    // Все имена видны в кнопках
    expect(btnTexts.some((t) => t.includes('Активный'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Прошедший'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('НеПрошедший'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Выбывший'))).toBe(true);
    // Активный имеет маркер 🏃 и кнопки действий
    expect(
      btnTexts.some((t) => t.includes('🏃') && t.includes('Активный')),
    ).toBe(true);
    // Прошедший имеет маркер ✅
    expect(
      btnTexts.some((t) => t.includes('✅') && t.includes('Прошедший')),
    ).toBe(true);
    // Не прошедший имеет маркер ↩️
    expect(
      btnTexts.some((t) => t.includes('↩️') && t.includes('НеПрошедший')),
    ).toBe(true);
    // Выбывший имеет маркер 🚫
    expect(
      btnTexts.some((t) => t.includes('🚫') && t.includes('Выбывший')),
    ).toBe(true);
    // Завершённые (advanced/not_advanced) имеют кнопку 🔄
    expect(btnTexts.some((t) => t === '🔄')).toBe(true);
  });

  test('Сортировка: 🛑 → ⚠️ → 🏃 по прогрессу → ✅', async () => {
    const appApi = {
      execute: mock((name: string) => {
        if (name === 'list-stream-students')
          return [
            {
              uuid: 'st-ok',
              userId: 'u-ok',
              status: 'active',
              currentStepId: 'step-a',
              steps: [
                {
                  stepId: 'step-a',
                  status: 'completed',
                  completedAt: '2026-08-01T10:00',
                },
              ],
            },
            {
              uuid: 'st-lag',
              userId: 'u-lag',
              status: 'active',
              currentStepId: 'step-a',
              steps: [
                {
                  stepId: 'step-a',
                  status: 'completed',
                  completedAt: '2026-07-27T10:00',
                },
              ],
            },
            {
              uuid: 'st-crit',
              userId: 'u-crit',
              status: 'active',
              currentStepId: 'step-a',
              steps: [
                {
                  stepId: 'step-a',
                  status: 'completed',
                  completedAt: '2026-07-20T10:00',
                },
              ],
            },
            {
              uuid: 'st-done',
              userId: 'u-done',
              status: 'advanced',
              steps: [],
            },
          ];
        if (name === 'get-stream')
          return {
            uuid: 's1',
            title: 'Поток',
            status: 'active',
            mentorId: 'mentor-1',
            contentSnapshot: [
              {
                projectTitle: 'P1',
                lessons: [
                  {
                    lessonTitle: 'L1',
                    stepIds: ['step-a', 'step-b', 'step-c'],
                  },
                ],
              },
            ],
          };
        return undefined;
      }),
    } as unknown as U7BotApp;
    const appApi = {
      execute: mock((_name: string, params: any) => {
        const names: Record<string, string> = {
          'u-ok': 'ОК',
          'u-lag': 'Отстаёт',
          'u-crit': 'Крит',
          'u-done': 'Готов',
        };
        return { uuid: params?.uuid, name: names[params?.uuid] ?? '??' };
      }),
    } as unknown as U7BotApp;

    const story = new MonitorStory();
    story.init(moduleApi, appApi);

    const response = await story.handleCallback('students:s1', actor, session);
    const rows = response.sendMessage?.keyboard?.rows ?? [];
    // Первый студент в первой строке — самый критический
    expect(rows[0]?.[0]?.text).toContain('🛑');
    expect(rows[0]?.[0]?.text).toContain('Крит');
    // Второй — отстающий
    expect(rows[1]?.[0]?.text).toContain('⚠️');
    expect(rows[1]?.[0]?.text).toContain('Отстаёт');
    // Третий — в процессе
    expect(rows[2]?.[0]?.text).toContain('🏃');
    expect(rows[2]?.[0]?.text).toContain('ОК');
    // Четвёртый — завершённый
    expect(rows[3]?.[0]?.text).toContain('✅');
    expect(rows[3]?.[0]?.text).toContain('Готов');
    // Последняя строка — «Назад к потоку»
    const lastRow = rows[rows.length - 1];
    expect(lastRow?.[0]?.text).toBe('⬅️ Назад к потоку');
  });

  test('Студент без статуса ментора не видит кнопок действий в S07', async () => {
    const appApi = {
      execute: mock((name: string) => {
        if (name === 'list-stream-students')
          return [
            {
              uuid: 'st1',
              userId: 'u1',
              status: 'active',
              currentStepId: 'step-a',
              steps: [],
            },
          ];
        if (name === 'get-stream')
          return {
            uuid: 's1',
            title: 'Поток',
            status: 'active',
            // mentorId другой — не actor
            mentorId: 'other-mentor',
            contentSnapshot: [
              {
                projectTitle: 'P1',
                lessons: [{ lessonTitle: 'L1', stepIds: ['step-a'] }],
              },
            ],
          };
        return undefined;
      }),
    } as unknown as U7BotApp;
    const appApi = {
      execute: mock(() => ({ uuid: 'u1', name: 'Петя' })),
    } as unknown as U7BotApp;

    const story = new MonitorStory();
    story.init(moduleApi, appApi);

    const response = await story.handleCallback('students:s1', actor, session);
    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];

    // Имя видно
    expect(btnTexts.some((t) => t.includes('Петя'))).toBe(true);
    // Кнопки действий — нет
    expect(btnTexts.some((t) => t === '⛔')).toBe(false);
    expect(btnTexts.some((t) => t === '✅')).toBe(false);
  });

  test('активный студент имеет 3 кнопки (имя + ⛔ + ✅)', async () => {
    const appApi = {
      execute: mock((name: string) => {
        if (name === 'list-stream-students')
          return [
            {
              uuid: 'st1',
              userId: 'u1',
              status: 'active',
              steps: [],
            },
          ];
        if (name === 'get-stream')
          return {
            uuid: 's1',
            title: 'Поток',
            status: 'active',
            mentorId: 'mentor-1',
            contentSnapshot: [
              {
                projectTitle: 'P1',
                lessons: [{ lessonTitle: 'L1', stepIds: ['step-a'] }],
              },
            ],
          };
        return undefined;
      }),
    } as unknown as U7BotApp;
    const appApi = {
      execute: mock(() => ({ uuid: 'u1', name: 'Петя' })),
    } as unknown as U7BotApp;

    const story = new MonitorStory();
    story.init(moduleApi, appApi);

    const response = await story.handleCallback('students:s1', actor, session);
    const rows = response.sendMessage?.keyboard?.rows ?? [];
    // Первая строка = студент с 3 кнопками
    expect(rows[0]?.length).toBe(3);
    // Вторая строка = «Назад к потоку»
    expect(rows[1]?.length).toBe(1);
  });

  test('S08 показывает причину критического отставания', async () => {
    const appApi = {
      execute: mock((name: string) => {
        if (name === 'get-student-progress')
          return {
            uuid: 'st1',
            streamId: 's1',
            userId: 'u1',
            status: 'active',
            currentStepId: 'step-2',
            steps: [
              {
                stepId: 'step-1',
                status: 'completed',
                issuedAt: '2026-07-20T10:00',
                completedAt: '2026-07-21T10:00',
              },
              {
                stepId: 'step-2',
                status: 'issued',
                issuedAt: '2026-07-21T10:00',
              },
            ],
          };
        if (name === 'get-stream')
          return {
            uuid: 's1',
            title: 'Поток',
            status: 'active',
            mentorId: 'mentor-1',
            contentSnapshot: [
              {
                projectTitle: 'P1',
                lessons: [{ lessonTitle: 'L1', stepIds: ['step-1', 'step-2'] }],
              },
            ],
          };
        return undefined;
      }),
    } as unknown as U7BotApp;
    const appApi = {
      execute: mock(() => ({ uuid: 'u1', name: 'Иван' })),
    } as unknown as U7BotApp;

    const story = new MonitorStory();
    story.init(moduleApi, appApi);

    const response = await story.handleCallback('detail:st1', actor, session);
    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('Критическое отставание');
    expect(text).toContain('дн\\.');
    expect(text).not.toContain('ниже медианы');
  });

  test('S08 показывает статистику времени по категориям', async () => {
    const appApi = {
      execute: mock((name: string) => {
        if (name === 'get-student-progress')
          return {
            uuid: 'st1',
            streamId: 's1',
            userId: 'u1',
            status: 'active',
            currentStepId: 'step-3',
            steps: [
              {
                stepId: 'step-1',
                status: 'completed',
                issuedAt: '2026-08-01T10:00',
                completedAt: '2026-08-01T10:00',
              },
              {
                stepId: 'step-2',
                status: 'completed',
                issuedAt: '2026-08-01T10:00',
                completedAt: '2026-08-01T10:20',
              },
              {
                stepId: 'step-3',
                status: 'issued',
                issuedAt: '2026-08-01T10:00',
              },
            ],
          };
        if (name === 'get-stream')
          return {
            uuid: 's1',
            title: 'Поток',
            status: 'active',
            mentorId: 'mentor-1',
            contentSnapshot: [
              {
                projectTitle: 'P1',
                lessons: [
                  {
                    lessonTitle: 'L1',
                    stepIds: ['step-1', 'step-2', 'step-3'],
                  },
                ],
              },
            ],
          };
        return undefined;
      }),
    } as unknown as U7BotApp;
    const appApi = {
      execute: mock(() => ({ uuid: 'u1', name: 'Иван' })),
    } as unknown as U7BotApp;

    const story = new MonitorStory();
    story.init(moduleApi, appApi);

    const response = await story.handleCallback('detail:st1', actor, session);
    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('Типичное время на шаг');
    expect(text).toContain('Бегун');
    expect(text).toContain('Исследователь');
  });

  test('S08 не показывает статистику если нет завершённых шагов', async () => {
    const appApi = {
      execute: mock((name: string) => {
        if (name === 'get-student-progress')
          return {
            uuid: 'st1',
            streamId: 's1',
            userId: 'u1',
            status: 'active',
            currentStepId: 'step-1',
            steps: [
              {
                stepId: 'step-1',
                status: 'issued',
                issuedAt: '2026-08-01T10:00',
              },
            ],
          };
        if (name === 'get-stream')
          return {
            uuid: 's1',
            title: 'Поток',
            status: 'active',
            mentorId: 'mentor-1',
            contentSnapshot: [
              {
                projectTitle: 'P1',
                lessons: [{ lessonTitle: 'L1', stepIds: ['step-1'] }],
              },
            ],
          };
        return undefined;
      }),
    } as unknown as U7BotApp;
    const appApi = {
      execute: mock(() => ({ uuid: 'u1', name: 'Иван' })),
    } as unknown as U7BotApp;

    const story = new MonitorStory();
    story.init(moduleApi, appApi);

    const response = await story.handleCallback('detail:st1', actor, session);
    const text = response.sendMessage?.text ?? '';
    expect(text).not.toContain('Время на шаги');
    expect(text).not.toContain('Листатель');
  });

  test('GUEST видит S08 — детальную карточку с прогрессом и исходом', async () => {
    const guestActor: User = {
      uuid: 'guest-s08',
      name: 'Гость',
      telegramId: 777,
      roles: [],
      createdAt: '2026-01-01T00:00:00.000Z',
    };

    const appApi = {
      execute: mock((name: string) => {
        if (name === 'get-student-progress')
          return {
            uuid: 'st1',
            streamId: 's1',
            userId: 'u1',
            status: 'advanced',
            currentStepId: 'step-2',
            steps: [
              {
                stepId: 'step-1',
                status: 'completed',
                completedAt: '2026-01-02',
              },
              {
                stepId: 'step-2',
                status: 'completed',
                completedAt: '2026-01-03',
              },
            ],
          };
        if (name === 'get-stream')
          return {
            uuid: 's1',
            title: 'Поток',
            status: 'active',
            mentorId: 'mentor-1',
            contentSnapshot: [
              {
                projectTitle: 'Основы',
                lessons: [
                  { lessonTitle: 'Введение', stepIds: ['step-1', 'step-2'] },
                ],
              },
            ],
          };
        return undefined;
      }),
    } as unknown as U7BotApp;
    const appApi = {
      execute: mock(() => ({ uuid: 'u1', name: 'Иван Иванов' })),
    } as unknown as U7BotApp;

    const story = new MonitorStory();
    story.init(moduleApi, appApi);

    const response = await story.handleCallback(
      'detail:st1',
      guestActor,
      session,
    );
    assertResponseMarkdownSafe(response);

    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('Иван Иванов');
    expect(text).toContain('✅ Прошёл');
    expect(text).toContain('100%');

    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btnTexts.some((t) => t.includes('Назад к списку'))).toBe(true);
    expect(btnTexts.some((t) => t === '⛔')).toBe(false);
    expect(btnTexts.some((t) => t === '✅')).toBe(false);
  });

  test('students: если get-stream возвращает null — сообщение об ошибке', async () => {
    const appApi = {
      execute: mock((name: string) => {
        if (name === 'list-stream-students') return [];
        if (name === 'get-stream') return null;
        return undefined;
      }),
    } as unknown as U7BotApp;
    const appApi = {
      execute: mock(() => ({})),
    } as unknown as U7BotApp;

    const story = new MonitorStory();
    story.init(moduleApi, appApi);

    const response = await story.handleCallback('students:s1', actor, session);
    expect(response.sendMessage?.text).toBe('⚠️ Поток не найден');
  });
});

/** Вспомогательная функция для создания MonitorStory с моками */
function makeStory() {
  const appApi = {
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
  } as unknown as U7BotApp;
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
