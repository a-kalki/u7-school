import { describe, expect, mock, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import { Role } from '@u7-scl/user/domain';
import { StreamsController } from '../../src/streams/controller';

describe('StreamsController (реестр)', () => {
  const mockAppApi = {
    execute: mock((name: string) => {
      if (name === 'list-streams') {
        return [
          {
            uuid: 'e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e',
            title: 'Поток',
            status: 'enrollment',
          },
        ];
      }
      if (name === 'get-stream')
        return {
          uuid: 's-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s',
          title: 'Test',
          description: '',
          status: 'active',
          startDate: '',
        };
      if (name === 'list-stream-students') return [];
      if (name === 'get-user') return { uuid: 'm1', name: 'Ментор', roles: [] };
      return undefined;
    }),
  } as never;

  const mockUiApp = {
    getAction: mock(() => () => ({
      text: '↩️ Главное меню',
      code: 'app:main-menu',
    })),
    collectAllMenuItems: mock(() => []),
    collectAllHelpDescriptions: mock(() => []),
  } as never;

  const makeController = () => new StreamsController();

  const guestActor: User = {
    uuid: 'u1',
    name: 'Гость',
    telegramId: 123,
    roles: [Role.GUEST],
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  test('имя контроллера — stream', () => {
    const controller = makeController();
    expect(controller.name).toBe('stream');
  });

  test('содержит 2 stories (catalog + view-stream)', () => {
    const controller = makeController();
    const stories = (controller as unknown as { stories: unknown[] }).stories;
    expect(stories.length).toBe(2);
  });

  test('handleStart агрегирует кнопки от stories', async () => {
    const controller = makeController();
    controller.init(mockAppApi, mockUiApp);

    const items = await controller.handleStart(guestActor);

    expect(items.length).toBeGreaterThanOrEqual(1);
    const texts = items.map((i) => i.text);
    expect(texts).toContain('📚 Потоки курсов');
  });

  test('handleCallback форвардит catalog:list', async () => {
    const controller = makeController();
    controller.init(mockAppApi, mockUiApp);

    const session = { activeHandler: null };

    const response = await controller.handleCallback(
      'catalog:list',
      guestActor,
      session,
    );
    expect(response.sendMessage?.text).toBeDefined();
    expect(response.sendMessage?.text).toContain('Потоки');
  });

  test('handleCallback форвардит view-stream:view', async () => {
    const controller = makeController();
    controller.init(mockAppApi, mockUiApp);

    const session = { activeHandler: null };

    const response = await controller.handleCallback(
      'view-stream:view:s-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s',
      guestActor,
      session,
    );
    expect(response.sendMessage?.text).toBeDefined();
  });

  test('handleCallback — неизвестный префикс', async () => {
    const controller = makeController();
    const session = { activeHandler: null };

    const response = await controller.handleCallback(
      'unknown:action',
      guestActor,
      session,
    );
    expect(response.sendMessage?.text).toContain('Неизвестная');
  });
});
