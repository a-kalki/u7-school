import { describe, expect, mock, test } from 'bun:test';
import type { StreamApiModule } from '../../../api/module';
import { StreamController } from './stream-controller';

describe('StreamController', () => {
  const mockStreamApi = {
    handle: mock((cmd: any) => {
      if (cmd.name === 'list-streams')
        return Promise.resolve([
          {
            uuid: 'test-uuid-test-uuid-test-uuid-te',
            title: 'Тестовый Поток',
            status: 'enrollment',
          },
        ]);
      if (cmd.name === 'get-stream')
        return Promise.resolve({
          uuid: 'abc-123',
          title: 'Тестовый Поток',
          description: 'Описание',
          status: 'enrollment',
          startDate: '2026-06-01T00:00:00.000Z',
          mentorId: 'm-m-m-m-m-m-m-m-m-m-m-m-m-m-m-m',
          moduleId: 'modmodmo-modm-odmo-dmod-modmodmodmo',
          contentSnapshot: [],
          createdAt: '2026-05-01T00:00:00.000Z',
        });
      if (cmd.name === 'list-stream-students') return Promise.resolve([]);
      if (cmd.name === 'enroll-student') return Promise.resolve(undefined);
      if (cmd.name === 'get-student-progress') return Promise.resolve({ currentStepId: 's1' });
      if (cmd.name === 'complete-step') return Promise.resolve({ level: 'step', currentStepId: 's2' });
      return Promise.resolve(undefined);
    }),
  } as unknown as StreamApiModule;

  test('handleUpdate обрабатывает команду streams', async () => {
    const controller = new StreamController(mockStreamApi);
    const response = await controller.handleUpdate(
      { type: 'command', command: 'streams', telegramId: 1 },
      'u1',
    );
    expect(response.sendMessage?.text).toContain('Потоки школы');
    expect(response.sendMessage?.keyboard).toBeDefined();
  });

  test('handleEnroll выполняет зачисление', async () => {
    const controller = new StreamController(mockStreamApi);
    const response = await controller.handleEnroll('u1', 's1');
    expect(response.sendMessage?.text).toContain('записаны');
  });

  test('handleEnroll с telegramGroupId показывает ссылку на чат', async () => {
    const mockWithGroup = {
      handle: mock((cmd: any) => {
        if (cmd.name === 'get-stream')
          return Promise.resolve({
            uuid: 's1',
            title: 'Поток',
            description: '...',
            status: 'enrollment',
            startDate: '2026-06-01T00:00:00.000Z',
            mentorId: 'm-m-m-m-m-m-m-m-m-m-m-m-m-m-m-m',
            moduleId: 'modmodmo-modm-odmo-dmod-modmodmodmo',
            contentSnapshot: [],
            createdAt: '2026-05-01T00:00:00.000Z',
            telegramGroupId: 'https://t.me/joinchat/ABC',
          });
        if (cmd.name === 'enroll-student') return Promise.resolve(undefined);
        return Promise.resolve(undefined);
      }),
    } as unknown as StreamApiModule;
    const controller = new StreamController(mockWithGroup);
    const response = await controller.handleEnroll('u1', 's1');
    expect(response.sendMessage?.text).toContain('записаны');
    expect(response.sendMessage?.text).toContain('ABC');
  });

  test('handleEnroll выбрасывает ошибку при отказе', async () => {
    const mockWithError = {
      handle: async (cmd: any) => {
        if (cmd.name === 'get-stream')
          return {
            uuid: 's1',
            title: 'Поток',
            description: '...',
            status: 'enrollment',
            startDate: '2026-06-01T00:00:00.000Z',
            mentorId: 'm-m-m-m-m-m-m-m-m-m-m-m-m-m-m-m',
            moduleId: 'modmodmo-modm-odmo-dmod-modmodmodmo',
            contentSnapshot: [],
            createdAt: '2026-05-01T00:00:00.000Z',
          };
        if (cmd.name === 'enroll-student')
          throw new Error('Доступ запрещён');
        return undefined;
      },
    } as unknown as StreamApiModule;
    const controller = new StreamController(mockWithError);
    const response = await controller.handleUpdate(
      { type: 'callback', data: 'enroll:s1', telegramId: 1, messageId: 42 },
      'u1',
    );
    expect(response.sendMessage?.text).toContain('ошибка');
  });

  test('handleCompleteStep выполняет завершение шага', async () => {
    const controller = new StreamController(mockStreamApi);
    const response = await controller.handleCompleteStep('u1', 'stu1', 's1', 'step1');
    expect(response.sendMessage?.text).toContain('Шаг выполнен');
  });

  test('handleUpdate: неизвестная команда возвращает ошибку', async () => {
    const controller = new StreamController(mockStreamApi);
    const response = await controller.handleUpdate(
      { type: 'command', command: 'unknown_cmd', telegramId: 1 },
      'u1',
    );
    expect(response.sendMessage?.text).toContain('не поддерживается');
  });

  test('handleUpdate: неизвестный callback возвращает ошибку', async () => {
    const controller = new StreamController(mockStreamApi);
    const response = await controller.handleUpdate(
      {
        type: 'callback',
        data: 'unknown:action',
        telegramId: 1,
        messageId: 42,
      },
      'u1',
    );
    expect(response.sendMessage?.text).toContain('не поддерживается');
  });

  test('handleUpdate: callback stream:view:<id> маршрутизирует на handleStreamView', async () => {
    const controller = new StreamController(mockStreamApi);
    const response = await controller.handleUpdate(
      {
        type: 'callback',
        data: 'stream:view:abc-123',
        telegramId: 1,
        messageId: 42,
      },
      'u1',
    );
    // Не должно быть сообщения об ошибке «не поддерживается»
    expect(response.sendMessage?.text).not.toContain('не поддерживается');
  });

  test('handleUpdate: команда my_study маршрутизирует на handleMyStudy', async () => {
    const controller = new StreamController(mockStreamApi);
    const response = await controller.handleUpdate(
      { type: 'command', command: 'my_study', telegramId: 1 },
      'u1',
    );
    expect(response.sendMessage?.text).toContain('не записаны');
  });

  test('handleUpdate: callback enroll:<streamId> маршрутизирует на handleEnroll', async () => {
    const controller = new StreamController(mockStreamApi);
    const response = await controller.handleUpdate(
      {
        type: 'callback',
        data: 'enroll:stream-uuid',
        telegramId: 1,
        messageId: 42,
      },
      'u1',
    );
    expect(response.sendMessage?.text).toContain('записаны');
  });

  test('handleUpdate: callback complete:<sid>:<strid>:<stepid> маршрутизирует', async () => {
    const controller = new StreamController(mockStreamApi);
    const response = await controller.handleUpdate(
      {
        type: 'callback',
        data: 'complete:stu1:s1:step1',
        telegramId: 1,
        messageId: 42,
      },
      'u1',
    );
    expect(response.sendMessage?.text).toContain('Шаг выполнен');
  });
});

describe('StreamController handleListStreams', () => {
  const sampleStreams = [
    {
      uuid: '11111111-1111-1111-1111-111111111111',
      title: 'Поток Набора',
      description: 'Идёт набор',
      mentorId: 'm1-m1-m1-m1-m1-m1-m1-m1-m1-m1',
      moduleId: 'mod1mod1-mod1-mod1-mod1-mod1mod1mod1',
      startDate: '2026-06-15T00:00:00.000Z',
      status: 'enrollment' as const,
      contentSnapshot: [],
      createdAt: '2026-05-01T00:00:00.000Z',
    },
    {
      uuid: '22222222-2222-2222-2222-222222222222',
      title: 'Активный Поток',
      description: 'Идёт обучение',
      mentorId: 'm1-m1-m1-m1-m1-m1-m1-m1-m1-m1',
      moduleId: 'mod1mod1-mod1-mod1-mod1-mod1mod1mod1',
      startDate: '2026-05-01T00:00:00.000Z',
      status: 'active' as const,
      contentSnapshot: [],
      createdAt: '2026-04-01T00:00:00.000Z',
    },
    {
      uuid: '33333333-3333-3333-3333-333333333333',
      title: 'Завершённый Поток',
      description: 'Завершён',
      mentorId: 'm1-m1-m1-m1-m1-m1-m1-m1-m1-m1',
      moduleId: 'mod1mod1-mod1-mod1-mod1-mod1mod1mod1',
      startDate: '2026-03-01T00:00:00.000Z',
      status: 'completed' as const,
      contentSnapshot: [],
      createdAt: '2026-02-01T00:00:00.000Z',
    },
  ];

  test('возвращает inline-клавиатуру со списком потоков', async () => {
    const mockApi = {
      handle: mock((_cmd: any) => Promise.resolve(sampleStreams)),
    } as unknown as StreamApiModule;
    const controller = new StreamController(mockApi);
    const response = await controller.handleListStreams();

    expect(response.sendMessage?.keyboard).toBeDefined();
    expect(response.sendMessage?.keyboard?.rows.length).toBe(3);
    // Каждая кнопка содержит название потока
    const firstBtn = response.sendMessage?.keyboard?.rows[0][0];
    expect(firstBtn?.text).toContain('Поток Набора');
    // callback_data должен быть stream:view:<uuid>
    expect(firstBtn?.code).toBe('stream:view:11111111-1111-1111-1111-111111111111');
  });

  test('пустой список → сообщение «Нет доступных потоков»', async () => {
    const mockApi = {
      handle: mock((_cmd: any) => Promise.resolve([])),
    } as unknown as StreamApiModule;
    const controller = new StreamController(mockApi);
    const response = await controller.handleListStreams();

    expect(response.sendMessage?.text).toContain('Нет доступных потоков');
    expect(response.sendMessage?.keyboard).toBeUndefined();
  });

  test('статус потока отображается эмодзи: 🟢 для набора', async () => {
    const mockApi = {
      handle: mock((_cmd: any) => Promise.resolve([sampleStreams[0]])),
    } as unknown as StreamApiModule;
    const controller = new StreamController(mockApi);
    const response = await controller.handleListStreams();

    expect(response.sendMessage?.keyboard?.rows[0][0].text).toContain('🟢');
  });

  test('статус потока отображается эмодзи: 🔵 для активного', async () => {
    const mockApi = {
      handle: mock((_cmd: any) => Promise.resolve([sampleStreams[1]])),
    } as unknown as StreamApiModule;
    const controller = new StreamController(mockApi);
    const response = await controller.handleListStreams();

    expect(response.sendMessage?.keyboard?.rows[0][0].text).toContain('🔵');
  });

  test('статус потока отображается эмодзи: ⚪ для завершённого', async () => {
    const mockApi = {
      handle: mock((_cmd: any) => Promise.resolve([sampleStreams[2]])),
    } as unknown as StreamApiModule;
    const controller = new StreamController(mockApi);
    const response = await controller.handleListStreams();

    expect(response.sendMessage?.keyboard?.rows[0][0].text).toContain('⚪');
  });
});

describe('StreamController handleStreamView', () => {
  const sampleStream = {
    uuid: 's-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s',
    title: 'Python Advanced',
    description: 'Продвинутый курс по Python',
    mentorId: 'm-m-m-m-m-m-m-m-m-m-m-m-m-m-m-m',
    moduleId: 'modmodmo-modm-odmo-dmod-modmodmodmo',
    startDate: '2026-06-01T00:00:00.000Z',
    status: 'enrollment' as const,
    contentSnapshot: [],
    createdAt: '2026-05-01T00:00:00.000Z',
  };

  const activeStream = {
    ...sampleStream,
    uuid: 'a-a-a-a-a-a-a-a-a-a-a-a-a-a-a-a',
    status: 'active' as const,
  };

  const makeMockApi = (
    stream: typeof sampleStream,
    studentCount: number,
  ) =>
    ({
      handle: mock((cmd: any) => {
        if (cmd.name === 'get-stream') return Promise.resolve(stream);
        if (cmd.name === 'list-stream-students')
          return Promise.resolve(
            Array.from({ length: studentCount }, (_, i) => ({
              uuid: `student-${i}`,
              userId: `user-${i}`,
              status: 'active',
            })),
          );
        return Promise.resolve(undefined);
      }),
    }) as unknown as StreamApiModule;

  test('карточка с названием, описанием, датой', async () => {
    const mockApi = makeMockApi(sampleStream, 0);
    const controller = new StreamController(mockApi);
    const response = await controller.handleStreamView(
      'u1',
      sampleStream.uuid,
    );

    expect(response.sendMessage?.text).toContain('Python Advanced');
    expect(response.sendMessage?.text).toContain('Продвинутый курс');
    expect(response.sendMessage?.text).toContain('01\\.06\\.2026');
  });

  test('на enrollment — кнопка «Записаться»', async () => {
    const mockApi = makeMockApi(sampleStream, 0);
    const controller = new StreamController(mockApi);
    const response = await controller.handleStreamView(
      'u1',
      sampleStream.uuid,
    );

    const keyboard = response.sendMessage?.keyboard;
    expect(keyboard).toBeDefined();
    const btnTexts = keyboard!.rows.flat().map((b) => b.text);
    expect(btnTexts.some((t) => t.includes('Записаться'))).toBe(true);
  });

  test('на active — кнопка «Записаться» скрыта', async () => {
    const mockApi = makeMockApi(activeStream, 5);
    const controller = new StreamController(mockApi);
    const response = await controller.handleStreamView(
      'u1',
      activeStream.uuid,
    );

    const keyboard = response.sendMessage?.keyboard;
    const btnTexts = keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btnTexts.some((t) => t.includes('Записаться'))).toBe(false);
  });

  test('отображает количество студентов', async () => {
    const mockApi = makeMockApi(sampleStream, 12);
    const controller = new StreamController(mockApi);
    const response = await controller.handleStreamView(
      'u1',
      sampleStream.uuid,
    );

    expect(response.sendMessage?.text).toContain('12');
  });
});

describe('StreamController handleMyStudy', () => {
  const mockStudent = {
    uuid: 'student-uuid-student-uuid-student',
    streamId: 's-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s',
    userId: 'u1',
    enrolledAt: '2026-06-01T00:00:00.000Z',
    status: 'active' as const,
    currentStepId: 'step-1',
    steps: [{ stepId: 'step-1', status: 'issued' as const, issuedAt: '2026-06-01T00:00:00.000Z' }],
    createdAt: '2026-06-01T00:00:00.000Z',
  };

  const mockStream = {
    uuid: 's-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s',
    title: 'Python',
    description: 'Курс',
    status: 'active',
    startDate: '2026-06-01T00:00:00.000Z',
    mentorId: 'm-m-m-m-m-m-m-m-m-m-m-m-m-m-m-m',
    moduleId: 'modmodmo-modm-odmo-dmod-modmodmodmo',
    contentSnapshot: [
      {
        projectId: 'p1',
        projectTitle: 'Основы',
        lessons: [
          {
            lessonId: 'l1',
            lessonTitle: 'Введение',
            stepIds: ['step-1', 'step-2'],
          },
        ],
      },
    ],
    createdAt: '2026-05-01T00:00:00.000Z',
  };

  const completedStudent = { ...mockStudent, status: 'completed' as const };

  test('активный студент — текущий шаг с кнопкой Выполнено', async () => {
    const mockApi = {
      handle: mock((cmd: any) => {
        if (cmd.name === 'get-student-by-user') return Promise.resolve(mockStudent);
        if (cmd.name === 'get-stream') return Promise.resolve(mockStream);
        return Promise.resolve(undefined);
      }),
    } as unknown as StreamApiModule;
    const controller = new StreamController(mockApi);
    const response = await controller.handleMyStudy('u1');

    expect(response.sendMessage?.text).toContain('Python');
    expect(response.sendMessage?.keyboard).toBeDefined();
    const btnTexts = response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btnTexts.some((t) => t.includes('Выполнено'))).toBe(true);
  });

  test('нет активной записи — сообщение «Вы не записаны»', async () => {
    const mockApi = {
      handle: mock((cmd: any) => {
        if (cmd.name === 'get-student-by-user') {
          const err: any = new Error('STREAM_NOT_FOUND');
          err.error = { name: 'STREAM_NOT_FOUND' };
          throw err;
        }
        return Promise.resolve(undefined);
      }),
    } as unknown as StreamApiModule;
    const controller = new StreamController(mockApi);
    const response = await controller.handleMyStudy('u1');

    expect(response.sendMessage?.text).toContain('не записаны');
  });

  test('студент завершил поток — поздравление', async () => {
    const mockApi = {
      handle: mock((cmd: any) => {
        if (cmd.name === 'get-student-by-user') return Promise.resolve(completedStudent);
        if (cmd.name === 'get-stream') return Promise.resolve(mockStream);
        return Promise.resolve(undefined);
      }),
    } as unknown as StreamApiModule;
    const controller = new StreamController(mockApi);
    const response = await controller.handleMyStudy('u1');

    expect(response.sendMessage?.text).toContain('завершил');
  });
});

describe('StreamController handleCompleteStep', () => {
  test('уровень step — новый шаг с кнопкой', async () => {
    const mockApi = {
      handle: mock((_cmd: any) =>
        Promise.resolve({ level: 'step', currentStepId: 'step-2' }),
      ),
    } as unknown as StreamApiModule;
    const controller = new StreamController(mockApi);
    const response = await controller.handleCompleteStep('u1', 'st1', 's1', 'step-1');

    expect(response.sendMessage?.text).toContain('Шаг');
  });

  test('уровень lesson — поздравление с уроком', async () => {
    const mockApi = {
      handle: mock((_cmd: any) =>
        Promise.resolve({
          level: 'lesson',
          currentStepId: 'step-5',
          completedLessonId: 'l1',
        }),
      ),
    } as unknown as StreamApiModule;
    const controller = new StreamController(mockApi);
    const response = await controller.handleCompleteStep('u1', 'st1', 's1', 'step-4');

    expect(response.sendMessage?.text).toContain('Урок');
  });

  test('уровень project — поздравление с проектом', async () => {
    const mockApi = {
      handle: mock((_cmd: any) =>
        Promise.resolve({
          level: 'project',
          currentStepId: 'step-10',
          completedProjectId: 'p1',
        }),
      ),
    } as unknown as StreamApiModule;
    const controller = new StreamController(mockApi);
    const response = await controller.handleCompleteStep('u1', 'st1', 's1', 'step-9');

    expect(response.sendMessage?.text).toContain('Проект');
  });

  test('уровень stream — финальное поздравление', async () => {
    const mockApi = {
      handle: mock((_cmd: any) =>
        Promise.resolve({ level: 'stream', completed: true }),
      ),
    } as unknown as StreamApiModule;
    const controller = new StreamController(mockApi);
    const response = await controller.handleCompleteStep('u1', 'st1', 's1', 'step-last');

    expect(response.sendMessage?.text).toContain('Поток');
    expect(response.sendMessage?.text).toContain('🏆');
  });
});

describe('StreamController handleProgress', () => {
  test('прогресс-бар и статистика', async () => {
    const mockApi = {
      handle: mock((cmd: any) => {
        if (cmd.name === 'get-student-by-user')
          return Promise.resolve({
            uuid: 'st1',
            streamId: 's1',
            userId: 'u1',
            status: 'active',
            currentStepId: 'step-3',
            steps: [
              { stepId: 'step-1', status: 'completed', issuedAt: '2026-06-01T00:00:00.000Z', completedAt: '2026-06-01T00:00:00.000Z' },
              { stepId: 'step-2', status: 'completed', issuedAt: '2026-06-01T00:00:00.000Z', completedAt: '2026-06-01T00:00:00.000Z' },
              { stepId: 'step-3', status: 'issued', issuedAt: '2026-06-01T00:00:00.000Z' },
            ],
            createdAt: '2026-06-01T00:00:00.000Z',
            enrolledAt: '2026-06-01T00:00:00.000Z',
          });
        if (cmd.name === 'get-stream')
          return Promise.resolve({
            uuid: 's1',
            title: 'Python',
            status: 'active',
            contentSnapshot: [
              {
                projectId: 'p1',
                projectTitle: 'Основы',
                lessons: [
                  { lessonId: 'l1', lessonTitle: 'Введение', stepIds: ['step-1', 'step-2'] },
                  { lessonId: 'l2', lessonTitle: 'Продвинутый', stepIds: ['step-3', 'step-4'] },
                ],
              },
            ],
            startDate: '2026-06-01T00:00:00.000Z',
            description: '...',
            mentorId: 'm-m-m-m-m-m-m-m-m-m-m-m-m-m-m-m',
            moduleId: 'modmodmo-modm-odmo-dmod-modmodmodmo',
            createdAt: '2026-05-01T00:00:00.000Z',
          });
        return Promise.resolve(undefined);
      }),
    } as unknown as StreamApiModule;
    const controller = new StreamController(mockApi);
    const response = await controller.handleProgress('u1', 's1');

    expect(response.sendMessage?.text).toContain('Прогресс');
    expect(response.sendMessage?.text).toContain('50');
  });
});

describe('StreamController handleMentorPanel', () => {
  test('ментор видит список своих потоков', async () => {
    const mockApi = {
      handle: mock((cmd: any) => {
        if (cmd.name === 'list-streams')
          return Promise.resolve([
            { uuid: 's1', title: 'Мой Поток', status: 'active' },
          ]);
        return Promise.resolve(undefined);
      }),
    } as unknown as StreamApiModule;
    const controller = new StreamController(mockApi);
    const response = await controller.handleMentorPanel('mentor-id');

    expect(response.sendMessage?.keyboard).toBeDefined();
    expect(response.sendMessage?.text).toContain('Мои потоки');
  });

  test('пустой список — сообщение', async () => {
    const mockApi = {
      handle: mock((_cmd: any) => Promise.resolve([])),
    } as unknown as StreamApiModule;
    const controller = new StreamController(mockApi);
    const response = await controller.handleMentorPanel('mentor-id');

    expect(response.sendMessage?.text).toContain('нет потоков');
  });
});

describe('StreamController handleCreateStream', () => {
  test('успешное создание потока', async () => {
    const mockApi = {
      handle: mock((_cmd: any) =>
        Promise.resolve({ uuid: 'new-stream', title: 'Новый Поток' }),
      ),
    } as unknown as StreamApiModule;
    const controller = new StreamController(mockApi);
    const response = await controller.handleCreateStream('mentor-id', {
      title: 'Новый Поток',
      description: 'Описание',
      mentorId: 'mentor-id',
      moduleId: 'modmodmo-modm-odmo-dmod-modmodmodmo',
      startDate: '2026-07-01T00:00:00.000Z',
      telegramGroupId: 'https://t.me/group',
    });

    expect(response.sendMessage?.text).toContain('создан');
  });
});

describe('StreamController handleActivateStream', () => {
  test('успешный запуск потока', async () => {
    const mockApi = {
      handle: mock((_cmd: any) => Promise.resolve(undefined)),
    } as unknown as StreamApiModule;
    const controller = new StreamController(mockApi);
    const response = await controller.handleActivateStream('mentor-id', 's1');

    expect(response.sendMessage?.text).toContain('запущен');
  });
});

describe('StreamController handleStreamStudents', () => {
  const sampleStudents = [
    {
      uuid: 'st1',
      streamId: 's1',
      userId: 'u1',
      status: 'active',
      currentStepId: 'step-3',
      steps: [
        { stepId: 'step-1', status: 'completed', issuedAt: '2026-06-01T00:00:00.000Z', completedAt: '2026-06-01T00:00:00.000Z' },
        { stepId: 'step-2', status: 'completed', issuedAt: '2026-06-01T00:00:00.000Z', completedAt: '2026-06-01T00:00:00.000Z' },
      ],
      enrolledAt: '2026-06-01T00:00:00.000Z',
      createdAt: '2026-06-01T00:00:00.000Z',
    },
  ];

  test('список студентов с прогрессом', async () => {
    const mockApi = {
      handle: mock((cmd: any) => {
        if (cmd.name === 'list-stream-students')
          return Promise.resolve(sampleStudents);
        if (cmd.name === 'get-stream')
          return Promise.resolve({
            uuid: 's1',
            title: 'Поток',
            status: 'active',
            contentSnapshot: [
              {
                projectId: 'p1',
                projectTitle: 'P1',
                lessons: [
                  {
                    lessonId: 'l1',
                    lessonTitle: 'L1',
                    stepIds: ['step-1', 'step-2', 'step-3', 'step-4'],
                  },
                ],
              },
            ],
            startDate: '2026-06-01T00:00:00.000Z',
            description: '...',
            mentorId: 'm-m-m-m-m-m-m-m-m-m-m-m-m-m-m-m',
            moduleId: 'modmodmo-modm-odmo-dmod-modmodmodmo',
            createdAt: '2026-05-01T00:00:00.000Z',
          });
        return Promise.resolve(undefined);
      }),
    } as unknown as StreamApiModule;
    const controller = new StreamController(mockApi);
    const response = await controller.handleStreamStudents('mentor-id', 's1');

    expect(response.sendMessage?.text).toContain('Студенты');
    expect(response.sendMessage?.text).toContain('50');
  });
});
