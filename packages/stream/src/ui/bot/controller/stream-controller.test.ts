import { describe, expect, mock, test } from 'bun:test';
import type { StreamApiModule } from '../../../api/module';
import { StreamController } from './stream-controller';

describe('StreamController', () => {
  const mockStreamApi = {
    useCases: [
      { ucName: 'list-streams', execute: mock(() => Promise.resolve([])) },
      { ucName: 'enroll-student', execute: mock(() => Promise.resolve()) },
      {
        ucName: 'get-student-progress',
        execute: mock(() => Promise.resolve({ currentStepId: 's1' })),
      },
      {
        ucName: 'complete-step',
        execute: mock(() =>
          Promise.resolve({ level: 'step', currentStepId: 's2' }),
        ),
      },
    ],
  } as unknown as StreamApiModule;

  test('handleUpdate обрабатывает команду streams', async () => {
    const controller = new StreamController(mockStreamApi);
    const response = await controller.handleUpdate(
      { type: 'command', command: 'streams', telegramId: 1 },
      'u1',
    );
    expect(response.sendMessage?.text).toContain('Список потоков');
  });

  test('handleMyStudy возвращает прогресс', async () => {
    const controller = new StreamController(mockStreamApi);
    const response = await controller.handleMyStudy('stu1');
    expect(response.sendMessage?.text).toContain('Ваш прогресс');
  });
});
