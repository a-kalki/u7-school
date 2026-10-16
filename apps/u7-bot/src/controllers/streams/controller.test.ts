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

  test('menuButtons пуст (сторис не экспортируют кнопок в главное меню)', async () => {
    const controller = makeController();
    controller.init({ appApi: mockAppApi } as never);

    const items = await controller.menuButtons(guestActor);
    expect(items).toHaveLength(0);
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

  describe('handleMessengerEvent', () => {
    const stream = {
      uuid: 'stream-111',
      title: 'JavaScript с нуля',
      telegramGroupId: '-1001234567890',
      mentorId: 'mentor-1',
    };

    const mentor = {
      uuid: 'mentor-1',
      name: 'Ментор Иван',
      telegramId: 999999,
      roles: [Role.MENTOR],
    };

    const studentUser: User = {
      uuid: 'student-1',
      name: 'Петр Студентов',
      telegramId: 777,
      roles: [Role.STUDENT],
      createdAt: '2026-01-01T00:00:00.000Z',
    };

    function makeMockStudent(
      status: 'active' | 'enrolled' | 'abandoned' | 'dropped',
    ) {
      return {
        uuid: '11111111-1111-4111-8111-111111111111',
        streamId: '11111111-1111-4111-8111-111111111111',
        userId: 'student-1',
        enrolledAt: '2026-01-01T00:00:00.000Z',
        status: status === 'dropped' ? 'abandoned' : status,
        currentStepId: '22222222-2222-4222-8222-222222222222',
        steps: [],
        createdAt: '2026-01-01T00:00:00.000Z',
      };
    }

    function setupStreamController(
      options: {
        students?: Array<Record<string, unknown>>;
        usersByTgId?: Record<number, User>;
      } = {},
    ) {
      const controller = new StreamsController();
      const notifyMock = mock(async () => {});
      const proactiveSender = {
        notify: notifyMock,
        execute: mock(async () => {}),
      };

      const userFacade = {
        getUserByTelegramId: mock(async (tgId: number) => {
          return (
            options.usersByTgId?.[tgId] ?? (tgId === 777 ? studentUser : null)
          );
        }),
      };

      const appApi = {
        execute: mock(async (name: string, payload: any) => {
          if (name === 'list-streams') return [stream];
          if (name === 'list-stream-students') {
            return options.students ?? [makeMockStudent('active')];
          }
          if (name === 'get-user' && payload?.uuid === 'mentor-1') {
            return mentor;
          }
          return null;
        }),
      };

      controller.init(
        {
          appApi,
          userFacade,
        } as any,
        proactiveSender as any,
      );

      return { controller, notifyMock, appApi, userFacade };
    }

    test('member_joined: неизвестный участник в группе потока → ментору отправляется предупреждение и stop', async () => {
      const { controller, notifyMock } = setupStreamController({
        students: [], // в потоке нет этого студента
      });

      const result = await controller.handleMessengerEvent({
        kind: 'member_joined',
        chatId: '-1001234567890',
        user: { id: 888, firstName: 'Аноним', username: 'anon' },
      });

      expect(result).toBe('stop');
      expect(notifyMock).toHaveBeenCalledTimes(1);
      const [mentorTgId, payload] = notifyMock.mock.calls[0] as [
        number,
        { text: string },
      ];
      expect(mentorTgId).toBe(999999);
      expect(payload.text).toContain('JavaScript с нуля');
      expect(payload.text).toContain('Аноним');
      expect(payload.text).toContain('@anon');
      expect(payload.text).toContain('не числится студентом этого потока');
    });

    test('member_joined: активный студент потока → ментор НЕ получает предупреждение и stop', async () => {
      const { controller, notifyMock } = setupStreamController({
        students: [makeMockStudent('active')],
      });

      const result = await controller.handleMessengerEvent({
        kind: 'member_joined',
        chatId: '-1001234567890',
        user: { id: 777, firstName: 'Петр' },
      });

      expect(result).toBe('stop');
      expect(notifyMock).not.toHaveBeenCalled();
    });

    test('member_left: активный студент вышел из группы потока → ментору отправляется уведомление (FR-7) и stop', async () => {
      const { controller, notifyMock } = setupStreamController({
        students: [makeMockStudent('active')],
      });

      const result = await controller.handleMessengerEvent({
        kind: 'member_left',
        chatId: '-1001234567890',
        user: { id: 777, firstName: 'Петр' },
      });

      expect(result).toBe('stop');
      expect(notifyMock).toHaveBeenCalledTimes(1);
      const [mentorTgId, payload] = notifyMock.mock.calls[0] as [
        number,
        { text: string },
      ];
      expect(mentorTgId).toBe(999999);
      expect(payload.text).toContain('Петр Студентов');
      expect(payload.text).toContain('JavaScript с нуля');
      expect(payload.text).toContain('покинул группу');
    });

    test('member_left: отчисленный/неактивный студент вышел из группы → уведомление ментору НЕ отправляется и stop', async () => {
      const { controller, notifyMock } = setupStreamController({
        students: [makeMockStudent('dropped')],
      });

      const result = await controller.handleMessengerEvent({
        kind: 'member_left',
        chatId: '-1001234567890',
        user: { id: 777, firstName: 'Петр' },
      });

      expect(result).toBe('stop');
      expect(notifyMock).not.toHaveBeenCalled();
    });

    test('событие в чужой группе (не привязанной к потокам) → pass', async () => {
      const { controller, notifyMock } = setupStreamController();

      const result = await controller.handleMessengerEvent({
        kind: 'member_joined',
        chatId: '-1009999999999',
        user: { id: 888, firstName: 'Аноним' },
      });

      expect(result).toBe('pass');
      expect(notifyMock).not.toHaveBeenCalled();
    });
  });
});
