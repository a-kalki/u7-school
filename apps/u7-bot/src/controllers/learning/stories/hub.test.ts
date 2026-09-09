import { describe, expect, mock, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import type { BotSession } from '@u7-scl/core/ui';
import { assertDialogResponseMarkdownSafe } from '@u7-scl/core/ui';
import { Role } from '@u7-scl/user/domain';
import { HubStory } from './hub';

describe('HubStory', () => {
  const session: BotSession = { dialog: { path: 'learning/hub', seq: 1 } };

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

    const story = new HubStory();
    story.init({ appApi: mockAppApi } as never);
    return { story, mockAppApi };
  }

  test('my-study — экран хаба с кнопками', async () => {
    const { story } = makeStory();

    const response = await story.handleCallback('my-study', studentActor, session);
    assertDialogResponseMarkdownSafe(response);

    const text = String(response.screen?.text);
    expect(text).toContain('Моя учёба');

    const btns = response.screen?.keyboard?.rows.flat() ?? [];
    const btnTexts = btns.map((b) => b.text);
    expect(btnTexts.some((t) => t.includes('Продолжить учёбу'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Уроки'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Мой прогресс'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Покинуть поток'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Главное меню'))).toBe(true);

    // Коды навигации — мосты в стори контроллера (§3 И1–И2)
    const cont = btns.find((b) => b.text.includes('Продолжить учёбу'));
    expect(cont?.code).toBe('step-view:my-study:continue');
    const lessons = btns.find((b) => b.text.includes('Уроки'));
    expect(lessons?.code).toBe('nav-tree:my-study:lessons');
    const progress = btns.find((b) => b.text.includes('Мой прогресс'));
    expect(progress?.code).toBe(`progress:progress:${STREAM_ID}`);
  });

  test('my-study — студент не записан', async () => {
    const { story } = makeStory({
      'get-student-by-user': (() => {
        throw new Error('not found');
      }) as unknown,
    });

    const response = await story.handleCallback('my-study', studentActor, session);
    assertDialogResponseMarkdownSafe(response);

    expect(String(response.screen?.text)).toContain('не записаны');
  });

  test('my-study — завершивший студент (без Продолжить и Уроки)', async () => {
    const { story } = makeStory({
      'get-student-by-user': { ...mockStudent, status: 'advanced' },
    });

    const response = await story.handleCallback('my-study', studentActor, session);

    const btnTexts =
      response.screen?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btnTexts.some((t) => t.includes('Продолжить'))).toBe(false);
    expect(btnTexts.some((t) => t.includes('Уроки'))).toBe(false);
    expect(btnTexts.some((t) => t.includes('Мой прогресс'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Покинуть поток'))).toBe(true);
  });

  test('my-study — не начавший учёбу видит «Начать учёбу»', async () => {
    const { story } = makeStory({
      'get-student-by-user': {
        ...mockStudent,
        steps: [{ stepId: 'step-1', status: 'issued' }],
      },
    });

    const response = await story.handleCallback('my-study', studentActor, session);
    const btnTexts =
      response.screen?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btnTexts.some((t) => t.includes('Начать учёбу'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Продолжить учёбу'))).toBe(false);
  });

  test('my-study:leave-confirm — confirm-диалог', async () => {
    const { story } = makeStory();

    const response = await story.handleCallback(
      'my-study:leave-confirm',
      studentActor,
      session,
    );
    assertDialogResponseMarkdownSafe(response);

    expect(String(response.screen?.text)).toContain('уверены');

    const btnTexts =
      response.screen?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btnTexts.some((t) => t.includes('Да'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Отмена'))).toBe(true);
  });

  test('my-study:leave — вызывает drop-student и прощается экраном', async () => {
    const executeSpy = mock((name: string, ..._args: unknown[]) => {
      if (name === 'get-student-by-user') return mockStudent;
      if (name === 'drop-student') return undefined;
      return undefined;
    });

    const story = new HubStory();
    story.init({ appApi: { execute: executeSpy } } as never);

    const response = await story.handleCallback(
      'my-study:leave',
      studentActor,
      session,
    );
    assertDialogResponseMarkdownSafe(response);

    const dropCalls = executeSpy.mock.calls.filter(
      (c: unknown[]) => c[0] === 'drop-student',
    );
    expect(dropCalls.length).toBe(1);
    expect(dropCalls[0]![1]).toEqual({
      streamId: STREAM_ID,
      studentId: mockStudent.uuid,
    });

    expect(String(response.screen?.text)).toContain('покинули поток');
  });

  test('my-study:leave при ошибке — экран ошибки с кнопкой меню', async () => {
    const executeSpy = mock((name: string, ..._args: unknown[]) => {
      if (name === 'get-student-by-user') return mockStudent;
      if (name === 'drop-student') throw new Error('drop failed');
      return undefined;
    });

    const story = new HubStory();
    story.init({ appApi: { execute: executeSpy } } as never);

    const response = await story.handleCallback(
      'my-study:leave',
      studentActor,
      session,
    );

    expect(String(response.screen?.text)).toContain('⚠️');
  });

  test('menuButtons — STUDENT видит «🎓 Моя учёба» (priority 20)', async () => {
    const { story } = makeStory();
    const items = story.menuButtons(studentActor);
    const item = items.find((i) => i.text.includes('Моя учёба'));
    expect(item).toBeDefined();
    expect(item!.priority).toBe(20);
    if (item!.kind === 'callback') {
      expect(item!.action).toBe('hub:my-study');
    }
  });

  test('menuButtons — GUEST не видит кнопку', async () => {
    const { story } = makeStory();
    expect(story.menuButtons(guestActor)).toEqual([]);
  });

  test('menuButtons — описание содержит «Моя учёба»', async () => {
    const { story } = makeStory();
    const item = story.menuButtons(studentActor).find((i) =>
      i.text.includes('Моя учёба'),
    );
    expect(item?.description).toContain('Моя учёба');
  });

  test('неизвестная команда — экран unknownCommand', async () => {
    const { story } = makeStory();

    const response = await story.handleCallback(
      'unknown',
      studentActor,
      session,
    );
    expect(String(response.screen?.text)).toContain('Неизвестная');
  });
});

// ── Подписка на student.completed (И3: notify-текст без кнопок) ──

describe('HubStory — подписка на student.completed', () => {
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
      notify: mock(async () => {}),
      invite: mock(async () => {}),
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

  test('advanced + следующий модуль → notify-текст с подсказкой меню (без кнопок)', async () => {
    const { story, sender } = makeStoryWithSender({
      courseId: 'c-1',
      isFirst: false,
      isLast: false,
      prevModuleId: 'm-0',
      nextModuleId,
    });

    await getSub(story).handle(makeCompletedEvent('advanced'));

    // И3: notify — текст без кнопок; invite-канал не используется
    expect(sender.invite).not.toHaveBeenCalled();
    expect(sender.notify).toHaveBeenCalledTimes(1);
    const [tgId, payload] = (sender.notify as ReturnType<typeof mock>).mock
      .calls[0] as [
      number,
      { text: string; kind?: string },
    ];
    expect(tgId).toBe(123);
    expect(payload.text).toContain('заверш');
    expect(payload.text).toContain('/start');
    expect(payload.kind).toBe('notify');
  });

  test('not_advanced → notify «пройти модуль снова» с подсказкой меню', async () => {
    const { story, sender } = makeStoryWithSender({
      courseId: 'c-1',
      isFirst: false,
      isLast: false,
      nextModuleId,
    });

    await getSub(story).handle(makeCompletedEvent('not_advanced'));

    expect(sender.invite).not.toHaveBeenCalled();
    expect(sender.notify).toHaveBeenCalledTimes(1);
    const [, payload] = (sender.notify as ReturnType<typeof mock>).mock
      .calls[0] as [{ text: string; kind?: string }];
    expect(payload.text).toContain('не пройден');
    expect(payload.text).toContain('/start');
  });

  test('advanced + последний модуль → ничего не шлётся (уведомление — из UC, 7c)', async () => {
    const { story, sender } = makeStoryWithSender({
      courseId: 'c-1',
      isFirst: false,
      isLast: true,
      prevModuleId: 'm-0',
    });

    await getSub(story).handle(makeCompletedEvent('advanced'));

    expect(sender.notify).not.toHaveBeenCalled();
    expect(sender.invite).not.toHaveBeenCalled();
  });

  test('нет telegramId → сообщения не отправляются', async () => {
    const { story, sender } = makeStoryWithSender({
      courseId: 'c-1',
      isLast: false,
      nextModuleId,
    });
    (
      story as unknown as { appApi: { execute: ReturnType<typeof mock> } }
    ).appApi.execute.mockImplementation(async (name: string) =>
      name === 'get-user'
        ? { uuid: 'user-1', telegramId: undefined }
        : undefined,
    );

    await getSub(story).handle(makeCompletedEvent('advanced'));

    expect(sender.notify).not.toHaveBeenCalled();
    expect(sender.invite).not.toHaveBeenCalled();
  });

  test('place undefined + advanced → ничего не шлётся (уведомление — из UC, 7d)', async () => {
    const { story, sender } = makeStoryWithSender(undefined);

    await getSub(story).handle(makeCompletedEvent('advanced'));

    expect(sender.notify).not.toHaveBeenCalled();
    expect(sender.invite).not.toHaveBeenCalled();
  });
});
