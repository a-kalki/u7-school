import { describe, expect, mock, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import { StreamController } from './stream-controller';

describe('StreamController (реестр)', () => {
  const mockModuleApi = {
    execute: mock((name: string, _attrs: unknown) => {
      if (name === 'list-streams') return [];
      if (name === 'get-stream')
        return {
          uuid: 's-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s',
          title: 'Test',
          description: '',
          status: 'active',
          startDate: '',
        };
      if (name === 'list-stream-students') return [];
      return undefined;
    }),
  } as any;

  const mockAppApi = {
    execute: mock(() => undefined),
  } as any;

  const makeController = () => new StreamController(mockModuleApi);

  const guestActor: User = {
    uuid: 'u1',
    name: 'Гость',
    telegramId: 123,
    roles: ['GUEST'],
    createdAt: '2026-01-01T00:00:00.000Z',
  };
  const studentActor: User = {
    uuid: 'u2',
    name: 'Студент',
    telegramId: 456,
    roles: ['STUDENT'],
    createdAt: '2026-01-01T00:00:00.000Z',
  };
  const mentorActor: User = {
    uuid: 'u3',
    name: 'Ментор',
    telegramId: 789,
    roles: ['MENTOR'],
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  test('имя контроллера — stream', () => {
    const controller = makeController();
    expect(controller.name).toBe('stream');
  });

  test('содержит 8 stories', () => {
    const controller = makeController();
    const stories = (controller as unknown as { stories: unknown[] }).stories;
    expect(stories.length).toBe(8);
  });

  test('handleStart агрегирует кнопки от stories', async () => {
    const controller = makeController();
    controller.init(mockAppApi);

    const items = await controller.handleStart(guestActor);

    expect(items.length).toBeGreaterThanOrEqual(1);
    const texts = items.map((i) => i.text);
    expect(texts).toContain('📚 Наши потоки');
  });

  test('handleStart — STUDENT видит catalog + learning', async () => {
    const controller = makeController();
    controller.init(mockAppApi);

    const items = await controller.handleStart(studentActor);

    expect(items.length).toBeGreaterThanOrEqual(2);
    const texts = items.map((i) => i.text);
    expect(texts).toContain('📚 Наши потоки');
    expect(texts).toContain('📖 Моя учёба');
  });

  test('handleStart — MENTOR видит catalog + панель ментора', async () => {
    const controller = makeController();
    controller.init(mockAppApi);

    const items = await controller.handleStart(mentorActor);

    const texts = items.map((i) => i.text);
    expect(texts).toContain('📚 Наши потоки');
    expect(texts).toContain('🛠️ Панель ментора');
  });

  test('handleStart сортирует по priority', async () => {
    const controller = makeController();
    controller.init(mockAppApi);

    const items = await controller.handleStart(studentActor);

    for (let i = 1; i < items.length; i++) {
      expect(items[i]!.priority).toBeGreaterThanOrEqual(items[i - 1]!.priority);
    }
  });

  test('handleCallback форвардит по префиксу story', async () => {
    const controller = makeController();
    controller.init(mockAppApi);

    const session = { activeHandler: null };

    const response1 = await controller.handleCallback(
      'catalog:list',
      guestActor,
      session,
    );
    expect(response1.sendMessage?.text).toBeDefined();

    const response2 = await controller.handleCallback(
      'view-stream:view:s-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s',
      guestActor,
      session,
    );
    expect(response2.sendMessage?.text).toBeDefined();
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
