import { describe, expect, mock, test } from 'bun:test';
import type { ApiApp } from '@u7-scl/core/api';
import type { StreamAppMeta } from '../../../domain/module';
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
  const mockApi = mockModuleApi as unknown as ApiApp<StreamAppMeta>;

  const makeController = () => new StreamController(mockModuleApi);

  test('имя контроллера — stream', () => {
    const controller = makeController();
    expect(controller.name).toBe('stream');
  });

  test('содержит 8 stories', () => {
    const controller = makeController();
    // stories — protected, используем доступ через прототип
    const stories = (controller as unknown as { stories: unknown[] }).stories;
    expect(stories.length).toBe(8);
  });

  test('handleStart агрегирует кнопки от stories', async () => {
    const controller = makeController();
    controller.init(mockApi);

    const actor = { uuid: 'u1', roles: ['GUEST'] };
    const items = await controller.handleStart(actor);

    // GUEST должен видеть только catalog
    expect(items.length).toBeGreaterThanOrEqual(1);
    const texts = items.map((i) => i.text);
    expect(texts).toContain('📚 Наши потоки');
  });

  test('handleStart — STUDENT видит catalog + learning', async () => {
    const controller = makeController();
    controller.init(mockApi);

    const actor = { uuid: 'u1', roles: ['STUDENT'] };
    const items = await controller.handleStart(actor);

    expect(items.length).toBeGreaterThanOrEqual(2);
    const texts = items.map((i) => i.text);
    expect(texts).toContain('📚 Наши потоки');
    expect(texts).toContain('📖 Моя учёба');
  });

  test('handleStart — MENTOR видит catalog + панель ментора', async () => {
    const controller = makeController();
    controller.init(mockApi);

    const actor = { uuid: 'u1', roles: ['MENTOR'] };
    const items = await controller.handleStart(actor);

    const texts = items.map((i) => i.text);
    expect(texts).toContain('📚 Наши потоки');
    expect(texts).toContain('🛠️ Панель ментора');
  });

  test('handleStart сортирует по priority', async () => {
    const controller = makeController();
    controller.init(mockApi);

    const actor = { uuid: 'u1', roles: ['STUDENT'] };
    const items = await controller.handleStart(actor);

    for (let i = 1; i < items.length; i++) {
      expect(items[i]!.priority).toBeGreaterThanOrEqual(items[i - 1]!.priority);
    }
  });

  test('handleCallback форвардит по префиксу story', async () => {
    const controller = makeController();
    controller.init(mockApi);

    const actor = { uuid: 'u1', roles: ['GUEST'] };
    const session = { activeHandler: null };

    // catalog:list
    const response1 = await controller.handleCallback(
      'catalog:list',
      actor,
      session,
    );
    expect(response1.sendMessage?.text).toBeDefined();

    // view-stream:view:uuid
    const response2 = await controller.handleCallback(
      'view-stream:view:s-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s',
      actor,
      session,
    );
    expect(response2.sendMessage?.text).toBeDefined();
  });

  test('handleCallback — неизвестный префикс', async () => {
    const controller = makeController();
    const actor = { uuid: 'u1', roles: ['GUEST'] };
    const session = { activeHandler: null };

    const response = await controller.handleCallback(
      'unknown:action',
      actor,
      session,
    );
    expect(response.sendMessage?.text).toContain('Неизвестная');
  });
});
