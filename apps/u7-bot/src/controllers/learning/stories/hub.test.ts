import { describe, expect, mock, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import type { SessionData } from '@u7-scl/core/ui';
import { assertResponseMarkdownSafe } from '@u7-scl/core/ui';
import { Role } from '@u7-scl/user/domain';
import { HubStory } from './hub';

describe('HubStory', () => {
  const session: SessionData = { activeHandler: null };

  const studentActor: User = {
    uuid: 'user-1',
    name: 'Студент',
    telegramId: 123,
    roles: [Role.STUDENT],
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  const guestActor: User = {
    uuid: 'user-2',
    name: 'Гость',
    telegramId: 456,
    roles: [Role.GUEST],
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  const STREAM_ID = '11111111-1111-1111-1111-111111111111';

  const mockStudent = {
    uuid: 'student-uuid',
    streamId: STREAM_ID,
    userId: 'user-1',
    status: 'active',
    currentStepId: 'step-1',
    steps: [{ stepId: 'step-1', status: 'completed' }],
  };

  function makeStory(appApiOverrides?: Record<string, unknown>) {
    const mockAppApi = {
      execute: mock((name: string) => {
        if (appApiOverrides && name in appApiOverrides)
          return appApiOverrides[name];
        if (name === 'get-student-by-user') return mockStudent;
        return undefined;
      }),
    };

    const mockUiApp = {
      getAction: mock((name: string) => {
        if (name === 'mainMenu') {
          return () => ({ text: '↩️ Главное меню', code: 'app:main-menu' });
        }
        throw new Error(`Действие «${name}» не найдено`);
      }),
      getController: mock(() => undefined),
    };

    const story = new HubStory();
    story.init({ appApi: mockAppApi, uiApp: mockUiApp } as never);
    return { story, mockAppApi };
  }

  test('handleCallback("my-study") показывает хаб с кнопками', async () => {
    const { story } = makeStory();

    const response = await story.handleCallback(
      'my-study',
      studentActor,
      session,
    );
    assertResponseMarkdownSafe(response);

    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('Моя учёба');

    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btnTexts.some((t) => t.includes('Продолжить учёбу'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Уроки'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Мой прогресс'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Покинуть поток'))).toBe(true);
  });

  test('handleCallback("my-study") — студент не записан', async () => {
    const { story } = makeStory({
      'get-student-by-user': undefined,
    });
    // Переопределяем execute чтобы бросал ошибку
    const errorStory = new HubStory();
    const errorAppApi = {
      execute: mock(() => {
        throw new Error('not found');
      }),
    };
    const mockUiApp = {
      getAction: mock(() => {
        throw new Error('not found');
      }),
      getController: mock(() => undefined),
    };
    errorStory.init({ appApi: errorAppApi, uiApp: mockUiApp } as never);

    const response = await errorStory.handleCallback(
      'my-study',
      studentActor,
      session,
    );
    assertResponseMarkdownSafe(response);

    expect(response.sendMessage?.text).toContain('не записаны');
  });

  test('handleCallback("my-study") — завершивший студент (без Продолжить и Уроки)', async () => {
    const { story } = makeStory({
      'get-student-by-user': { ...mockStudent, status: 'advanced' },
    });

    const response = await story.handleCallback(
      'my-study',
      studentActor,
      session,
    );

    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btnTexts.some((t) => t.includes('Продолжить'))).toBe(false);
    expect(btnTexts.some((t) => t.includes('Уроки'))).toBe(false);
    expect(btnTexts.some((t) => t.includes('Покинуть поток'))).toBe(true);
  });

  test('handleCallback("my-study:leave-confirm") показывает confirm-диалог', async () => {
    const { story } = makeStory();

    const response = await story.handleCallback(
      'my-study:leave-confirm',
      studentActor,
      session,
    );

    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('уверены');

    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btnTexts.some((t) => t.includes('Да'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Отмена'))).toBe(true);
  });

  test('handleCallback("my-study:leave") вызывает drop-student', async () => {
    const executeSpy = mock((_name: string, ..._args: unknown[]) => {
      if (_name === 'get-student-by-user') return mockStudent;
      if (_name === 'drop-student') return undefined;
      return undefined;
    });

    const mockUiApp = {
      getAction: mock(() => {
        throw new Error('not found');
      }),
      getController: mock(() => undefined),
    };

    const story = new HubStory();
    story.init({ appApi: { execute: executeSpy }, uiApp: mockUiApp } as never);

    const response = await story.handleCallback(
      'my-study:leave',
      studentActor,
      session,
    );

    const dropCalls = executeSpy.mock.calls.filter(
      (c: unknown[]) => c[0] === 'drop-student',
    );
    expect(dropCalls.length).toBe(1);
    expect(dropCalls[0]![1]).toEqual({
      streamId: STREAM_ID,
      studentId: mockStudent.uuid,
    });

    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('поток');
  });

  test('handleCallback("my-study:leave") при ошибке — handleError', async () => {
    const executeSpy = mock((_name: string, ..._args: unknown[]) => {
      if (_name === 'get-student-by-user') return mockStudent;
      if (_name === 'drop-student') throw new Error('drop failed');
      return undefined;
    });

    const mockUiApp = {
      getAction: mock(() => {
        throw new Error('not found');
      }),
      getController: mock(() => undefined),
    };

    const story = new HubStory();
    story.init({ appApi: { execute: executeSpy }, uiApp: mockUiApp } as never);

    const response = await story.handleCallback(
      'my-study:leave',
      studentActor,
      session,
    );

    // handleError должен вернуть сообщение об ошибке
    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('⚠️');
  });

  test('handleStart — STUDENT видит кнопку «Моя учёба»', async () => {
    const { story } = makeStory();
    const item = await story.handleStart(studentActor);
    expect(item?.text).toContain('Моя учёба');
    expect(item?.priority).toBe(20);
  });

  test('handleStart — GUEST не видит кнопку', async () => {
    const { story } = makeStory();
    const item = await story.handleStart(guestActor);
    expect(item).toBeNull();
  });

  test('handleStart — описание содержит «Моя учёба»', async () => {
    const { story } = makeStory();
    const item = await story.handleStart(studentActor);
    expect(item?.description).toContain('Моя учёба');
  });

  test('неизвестная команда', async () => {
    const { story } = makeStory();

    const response = await story.handleCallback(
      'unknown',
      studentActor,
      session,
    );
    expect(response.sendMessage?.text).toContain('Неизвестная');
  });

  test('handleMessage возвращает заглушку', async () => {
    const { story } = makeStory();
    const response = await story.handleMessage(
      { type: 'message', text: 'test', telegramId: 123 },
      studentActor,
      session,
    );
    expect(response.sendMessage?.text).toContain('Неизвестное');
  });
});

// ── Подписка на student.enrolled ──

describe('HubStory — подписка на student.enrolled', () => {
  const session: SessionData = { activeHandler: null };

  function makeEnrolledEvent() {
    return {
      eventId: 'ev-1',
      eventName: 'student.enrolled' as const,
      occurredAt: '2026-08-28T12:00:00.000Z',
      aggregateName: 'Student' as const,
      aggregateId: 'student-uuid',
      payload: {
        studentId: 'student-uuid',
        userId: 'user-1',
        streamId: '11111111-1111-1111-1111-111111111111',
        moduleId: 'module-1',
      },
    };
  }

  function makeStoryWithSender(overrides: Record<string, unknown> = {}) {
    const mockAppApi = {
      execute: mock((name: string) => {
        if (name in overrides) return overrides[name];
        if (name === 'get-user')
          return {
            uuid: 'user-1',
            name: 'Студент',
            telegramId: 123,
            roles: [Role.STUDENT],
            createdAt: '2026-01-01T00:00:00.000Z',
          };
        if (name === 'get-stream')
          return {
            uuid: '11111111-1111-1111-1111-111111111111',
            title: 'Поток по JS',
          };
        return undefined;
      }),
    };

    const sender = {
      send: mock(async () => {}),
      notify: mock(async () => {}),
      kickFromGroup: mock(async () => {}),
    };

    const story = new HubStory();
    story.init({ appApi: mockAppApi } as never, sender as never);
    return { story, sender };
  }

  test('getEventSubscriptions содержит подписку на student.enrolled', () => {
    const { story } = makeStoryWithSender();
    const subs = story.getEventSubscriptions();
    expect(subs.some((s) => s.eventName === 'student.enrolled')).toBe(true);
  });

  test('событие → send с текстом зачисления и кнопкой «Моя учёба»', async () => {
    const { story, sender } = makeStoryWithSender();
    const subs = story.getEventSubscriptions();
    const sub = subs.find((s) => s.eventName === 'student.enrolled');

    await sub!.handle(makeEnrolledEvent());

    expect(sender.send).toHaveBeenCalledTimes(1);
    const [tgId, command] = (sender.send as ReturnType<typeof mock>).mock
      .calls[0] as [
      number,
      {
        sendMessage: {
          text: string;
          keyboard?: { rows: { text: string; code: string }[][] };
        };
      },
    ];
    expect(tgId).toBe(123);
    expect(command.sendMessage.text).toContain('зачислен');
    expect(command.sendMessage.text).toContain('Поток по JS');
    const btn = command.sendMessage.keyboard?.rows[0]?.[0];
    expect(btn?.text).toContain('Моя учёба');
    // код кнопки — этой стори, без префикса контроллера (его добавит BotController.send)
    expect(btn?.code).toBe('hub:my-study');
  });

  test('у пользователя нет telegramId — send не вызывается', async () => {
    const { story, sender } = makeStoryWithSender({
      'get-user': {
        uuid: 'user-1',
        name: 'Студент',
        telegramId: undefined,
        roles: [Role.STUDENT],
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    });
    const subs = story.getEventSubscriptions();
    const sub = subs.find((s) => s.eventName === 'student.enrolled');

    await sub!.handle(makeEnrolledEvent());

    expect(sender.send).not.toHaveBeenCalled();
  });

  test('сбой get-stream не мешает сообщению (без названия потока)', async () => {
    const { story, sender } = makeStoryWithSender({
      'get-stream': Promise.reject(new Error('stream gone')),
    });
    const subs = story.getEventSubscriptions();
    const sub = subs.find((s) => s.eventName === 'student.enrolled');

    await sub!.handle(makeEnrolledEvent());

    expect(sender.send).toHaveBeenCalledTimes(1);
    const [, command] = (sender.send as ReturnType<typeof mock>).mock
      .calls[0] as [number, { sendMessage: { text: string } }];
    expect(command.sendMessage.text).toContain('зачислен');
    expect(command.sendMessage.text).not.toContain('Поток по JS');
  });
});

// ── Подписка на student.completed ──

describe('HubStory — подписка на student.completed', () => {
  const session: SessionData = { activeHandler: null };

  const moduleId = '33333333-3333-4333-8333-333333333333';
  const nextModuleId = '55555555-5555-4555-8555-555555555555';

  function makeCompletedEvent(outcome: 'advanced' | 'not_advanced') {
    return {
      eventId: 'ev-2',
      eventName: 'student.completed' as const,
      occurredAt: '2026-08-28T12:00:00.000Z',
      aggregateName: 'Student' as const,
      aggregateId: 'student-uuid',
      payload: {
        studentId: 'student-uuid',
        userId: 'user-1',
        streamId: '11111111-1111-1111-1111-111111111111',
        moduleId,
        outcome,
      },
    };
  }

  function makeStoryWithSender(place: unknown = undefined) {
    const mockAppApi = {
      execute: mock(async (name: string) => {
        if (name === 'get-user')
          return {
            uuid: 'user-1',
            name: 'Студент',
            telegramId: 123,
            roles: [Role.STUDENT],
            createdAt: '2026-01-01T00:00:00.000Z',
          };
        if (name === 'get-module-place') return place;
        return undefined;
      }),
    };

    const sender = {
      send: mock(async () => {}),
      notify: mock(async () => {}),
      kickFromGroup: mock(async () => {}),
    };

    const story = new HubStory();
    story.init({ appApi: mockAppApi } as never, sender as never);
    return { story, sender };
  }

  function getSub(story: ReturnType<typeof makeStoryWithSender>['story']) {
    const sub = story
      .getEventSubscriptions()
      .find((s) => s.eventName === 'student.completed');
    if (!sub) throw new Error('подписка на student.completed не найдена');
    return sub;
  }

  test('advanced + есть следующий модуль → кнопка «Следующий модуль» на next', async () => {
    const { story, sender } = makeStoryWithSender({
      courseId: 'c-1',
      isFirst: false,
      isLast: false,
      prevModuleId: 'm-0',
      nextModuleId,
    });

    await getSub(story).handle(makeCompletedEvent('advanced'));

    // кнопка → обычное сообщение (ломает флоу), не notify
    expect(sender.notify).not.toHaveBeenCalled();
    expect(sender.send).toHaveBeenCalledTimes(1);
    const [tgId, command] = (sender.send as ReturnType<typeof mock>).mock
      .calls[0] as [
      number,
      {
        sendMessage: {
          text: string;
          keyboard?: { rows: { text: string; code: string }[][] };
        };
      },
    ];
    expect(tgId).toBe(123);
    expect(command.sendMessage.text).toContain('заверш');
    const btn = command.sendMessage.keyboard?.rows[0]?.[0];
    expect(btn?.text).toContain('Следующий модуль');
    // кросс-контроллерный код — Routes.course.wishModule(nextModuleId)
    expect(btn?.code).toBe(`course:course-catalog:wish:${nextModuleId}`);
  });

  test('not_advanced → кнопка «Пройти модуль снова» на тот же модуль', async () => {
    const { story, sender } = makeStoryWithSender({
      courseId: 'c-1',
      isFirst: false,
      isLast: false,
      nextModuleId,
    });

    await getSub(story).handle(makeCompletedEvent('not_advanced'));

    expect(sender.notify).not.toHaveBeenCalled();
    const [, command] = (sender.send as ReturnType<typeof mock>).mock
      .calls[0] as [
      number,
      {
        sendMessage: {
          keyboard?: { rows: { text: string; code: string }[][] };
        };
      },
    ];
    const btn = command.sendMessage.keyboard?.rows[0]?.[0];
    expect(btn?.text).toContain('снова');
    expect(btn?.code).toBe(`course:course-catalog:wish:${moduleId}`);
  });

  test('advanced + последний модуль → «Курс завершён» без кнопки', async () => {
    const { story, sender } = makeStoryWithSender({
      courseId: 'c-1',
      isFirst: false,
      isLast: true,
      prevModuleId: 'm-0',
    });

    await getSub(story).handle(makeCompletedEvent('advanced'));

    const [, payload] = (sender.notify as ReturnType<typeof mock>).mock
      .calls[0] as [number, { text: string }];
    expect(payload.text).toContain('Курс заверш');
    expect('keyboard' in payload).toBe(false);
  });

  test('нет telegramId → сообщения не отправляются', async () => {
    const { story, sender } = makeStoryWithSender({
      courseId: 'c-1',
      isLast: true,
    });
    // подменим get-user на пользователя без telegramId
    (
      story as unknown as { appApi: { execute: ReturnType<typeof mock> } }
    ).appApi.execute.mockImplementation(async (name: string) =>
      name === 'get-user'
        ? { uuid: 'user-1', telegramId: undefined }
        : undefined,
    );

    await getSub(story).handle(makeCompletedEvent('advanced'));

    expect(sender.notify).not.toHaveBeenCalled();
    expect(sender.send).not.toHaveBeenCalled();
  });

  test('place undefined + advanced → уведомление без кнопки', async () => {
    const { story, sender } = makeStoryWithSender(undefined);

    await getSub(story).handle(makeCompletedEvent('advanced'));

    const [, payload] = (sender.notify as ReturnType<typeof mock>).mock
      .calls[0] as [number, { text: string }];
    expect(payload.text).toContain('заверш');
    expect('keyboard' in payload).toBe(false);
  });
});
