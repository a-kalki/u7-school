import { describe, expect, mock, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import { Role } from '@u7-scl/user/domain';
import { CourseController } from './course-controller';

describe('CourseController (реестр)', () => {
  const mockModuleApi = {
    execute: mock(() => []),
  } as any;

  const mockAppApi = {
    execute: mock(() => undefined),
  } as any;

  const makeController = () => new CourseController(mockModuleApi);

  const guestActor: User = {
    uuid: 'u1',
    name: 'Гость',
    telegramId: 123,
    roles: [Role.GUEST],
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  test('имя контроллера — course', () => {
    const controller = makeController();
    expect(controller.name).toBe('course');
  });

  test('содержит 1 story', () => {
    const controller = makeController();
    const stories = (controller as unknown as { stories: unknown[] }).stories;
    expect(stories.length).toBe(1);
  });

  test('handleStart агрегирует кнопки от stories', async () => {
    const controller = makeController();
    controller.init(mockAppApi);

    const items = await controller.handleStart(guestActor);

    expect(items.length).toBeGreaterThanOrEqual(1);
    const texts = items.map((i) => i.text);
    expect(texts).toContain('📚 Программы курсов');
  });

  test('handleCallback форвардит по префиксу story', async () => {
    const controller = makeController();
    controller.init(mockAppApi);

    const session = { activeHandler: null };

    const response = await controller.handleCallback(
      'course-catalog:list',
      guestActor,
      session,
    );
    expect(response.sendMessage?.text).toBeDefined();
    expect(response.sendMessage?.text).toContain('Программы курсов');
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
