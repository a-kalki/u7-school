import { describe, expect, mock, test } from 'bun:test';
import type { StreamApiModule } from '../../../api/module';
import { StreamController } from './stream-controller';

describe('StreamController', () => {
  const mockStreamApi = {
    handle: mock((cmd: any) => {
      if (cmd.name === 'list-streams') return Promise.resolve([]);
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
    expect(response.sendMessage?.text).toContain('Список потоков');
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
