import { describe, expect, mock, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import type { BotSession } from '@u7-scl/core/ui';
import { Role } from '@u7-scl/user/domain';
import { StreamsController } from './controller';

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

  const makeController = () => new StreamsController();

  const guestActor: User = {
    uuid: 'u1',
    name: 'Гость',
    telegramId: 123,
    roles: [Role.GUEST],
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  const session: BotSession = {
    dialog: { path: 'stream/catalog', seq: 1 },
  };

  test('имя контроллера — stream', () => {
    const controller = makeController();
    expect(controller.name).toBe('stream');
  });

  test('содержит 3 stories (catalog + view-stream + inactivity)', () => {
    const controller = makeController();
    const stories = (controller as unknown as { stories: unknown[] }).stories;
    expect(stories.length).toBe(3);
  });

  test('menuButtons агрегирует кнопки от stories с префиксом контроллера', async () => {
    const controller = makeController();
    controller.init({ appApi: mockAppApi } as never);

    const items = await controller.menuButtons(guestActor);

    expect(items.length).toBeGreaterThanOrEqual(1);
    const texts = items.map((i) => i.text);
    expect(texts).toContain('📚 Потоки курсов');
    const callback = items.find((i) => i.kind === 'callback');
    if (callback?.kind === 'callback') {
      expect(callback.action).toBe('stream:catalog:list');
    }
  });

  test('handleCallback форвардит catalog:list', async () => {
    const controller = makeController();
    controller.init({ appApi: mockAppApi } as never);

    const response = await controller.handleCallback(
      'catalog:list',
      guestActor,
      session,
    );
    expect(response.screen?.text).toBeDefined();
    expect(String(response.screen?.text)).toContain('Потоки');
  });

  test('handleCallback форвардит view-stream:view', async () => {
    const controller = makeController();
    controller.init({ appApi: mockAppApi } as never);

    const response = await controller.handleCallback(
      'view-stream:view:s-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s',
      guestActor,
      session,
    );
    expect(response.screen?.text).toBeDefined();
  });

  test('handleCallback — неизвестный префикс', async () => {
    const controller = makeController();

    const response = await controller.handleCallback(
      'unknown:action',
      guestActor,
      session,
    );
    expect(String(response.screen?.text)).toContain('Неизвестная');
  });
});
