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

  test('handleCompleteStep выполняет завершение шага', async () => {
    const controller = new StreamController(mockStreamApi);
    const response = await controller.handleCompleteStep('u1', 'stu1', 's1', 'step1');
    expect(response.sendMessage?.text).toContain('Шаг завершён');
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
    expect(response.sendMessage?.text).toContain('Прогресс');
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
    expect(response.sendMessage?.text).toContain('Шаг завершён');
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
