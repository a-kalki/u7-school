import { describe, expect, mock, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import type { SessionData } from '@u7-scl/core/ui';
import { Role } from '@u7-scl/user/domain';
import { NavTreeStory } from './nav-tree';

describe('NavTreeStory', () => {
  const studentActor: User = {
    uuid: 'user-1',
    name: 'Студент',
    telegramId: 123,
    roles: [Role.STUDENT],
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  const STREAM_ID = '11111111-1111-1111-1111-111111111111';
  const STEP1_ID = '22222222-2222-2222-2222-222222222222';
  const STEP2_ID = '33333333-3333-3333-3333-333333333333';
  const STEP3_ID = '44444444-4444-4444-4444-444444444444';
  const STEP4_ID = '55555555-5555-5555-5555-555555555555';
  const STEP5_ID = '66666666-6666-6666-6666-666666666666';
  const STEP6_ID = '77777777-7777-7777-7777-777777777777';
  const STEP7_ID = '88888888-8888-8888-8888-888888888888';
  const STEP8_ID = '99999999-9999-9999-9999-999999999999';

  const LESSON1_ID = 'lesson-uuid-1';
  const LESSON2_ID = 'lesson-uuid-2';
  const LESSON3_ID = 'lesson-uuid-3';
  const LESSON4_ID = 'lesson-uuid-4';

  const session: SessionData = { activeHandler: null };
  const richSession: SessionData = {
    activeHandler: null,
    lastBotMessage: { text: 'предыдущее', messageId: 42 },
  };

  const richSnapshot = [
    {
      projectId: 'project-uuid-1',
      projectTitle: 'Основы',
      lessons: [
        {
          lessonId: LESSON1_ID,
          lessonTitle: 'Введение',
          stepIds: [STEP1_ID, STEP2_ID],
        },
        {
          lessonId: LESSON2_ID,
          lessonTitle: 'Переменные',
          stepIds: [STEP3_ID, STEP4_ID],
        },
      ],
    },
    {
      projectId: 'project-uuid-2',
      projectTitle: 'Продвинутый',
      lessons: [
        {
          lessonId: LESSON3_ID,
          lessonTitle: 'Функции',
          stepIds: [STEP5_ID, STEP6_ID],
        },
        {
          lessonId: LESSON4_ID,
          lessonTitle: 'Классы',
          stepIds: [STEP7_ID, STEP8_ID],
        },
      ],
    },
  ];

  const richStudent = {
    uuid: 'student-uuid',
    streamId: STREAM_ID,
    userId: 'user-1',
    status: 'active',
    currentStepId: STEP4_ID,
    steps: [
      {
        stepId: STEP1_ID,
        status: 'completed',
        issuedAt: '2026-01-01',
        completedAt: '2026-01-02',
      },
      {
        stepId: STEP2_ID,
        status: 'completed',
        issuedAt: '2026-01-02',
        completedAt: '2026-01-03',
      },
      {
        stepId: STEP3_ID,
        status: 'completed',
        issuedAt: '2026-01-03',
        completedAt: '2026-01-04',
      },
      { stepId: STEP4_ID, status: 'issued', issuedAt: '2026-01-04' },
    ],
  };

  const richStream = {
    uuid: STREAM_ID,
    title: 'Python',
    description: 'Курс',
    status: 'active',
    startDate: '2026-06-01T00:00:00.000Z',
    contentSnapshot: richSnapshot,
  };

  function makeStory(appApiOverrides?: Record<string, unknown>) {
    const allSteps: Record<string, Record<string, unknown>> = {
      [STEP1_ID]: {
        uuid: STEP1_ID,
        description: 'Первый шаг',
        kind: 'text',
        content: '1',
        status: 'published',
        createdAt: '2026-01-01',
      },
      [STEP2_ID]: {
        uuid: STEP2_ID,
        description: 'Второй шаг',
        kind: 'text',
        content: '2',
        status: 'published',
        createdAt: '2026-01-02',
      },
      [STEP3_ID]: {
        uuid: STEP3_ID,
        description: 'Третий шаг',
        kind: 'code',
        code: 'x=1',
        status: 'published',
        createdAt: '2026-01-03',
      },
      [STEP4_ID]: {
        uuid: STEP4_ID,
        description: 'Четвёртый шаг',
        kind: 'text',
        content: '4',
        status: 'published',
        createdAt: '2026-01-04',
      },
      [STEP5_ID]: {
        uuid: STEP5_ID,
        description: 'Пятый шаг',
        kind: 'text',
        content: '5',
        status: 'published',
        createdAt: '2026-01-05',
      },
      [STEP6_ID]: {
        uuid: STEP6_ID,
        description: 'Шестой шаг',
        kind: 'text',
        content: '6',
        status: 'published',
        createdAt: '2026-01-06',
      },
      [STEP7_ID]: {
        uuid: STEP7_ID,
        description: 'Седьмой шаг',
        kind: 'text',
        content: '7',
        status: 'published',
        createdAt: '2026-01-07',
      },
      [STEP8_ID]: {
        uuid: STEP8_ID,
        description: 'Восьмой шаг',
        kind: 'text',
        content: '8',
        status: 'published',
        createdAt: '2026-01-08',
      },
    };

    const appApiSpy = mock((name: string, params?: Record<string, unknown>) => {
      if (appApiOverrides && name in appApiOverrides) {
        const val = appApiOverrides[name];
        if (typeof val === 'function') return (val as () => unknown)();
        if (val instanceof Error) throw val;
        return val;
      }
      if (name === 'get-student-by-user') return richStudent;
      if (name === 'get-student-progress') return richStudent;
      if (name === 'get-stream') return richStream;
      if (name === 'get-step') {
        const p = params as { uuid: string };
        return allSteps[p.uuid] as unknown;
      }
      if (name === 'get-steps-by-lessons') {
        const p = params as { lessonIds: string[] };
        const result: Record<
          string,
          Array<{ uuid: string; description: string }>
        > = {};
        for (const lid of p.lessonIds) {
          const ids =
            lid === LESSON1_ID
              ? [STEP1_ID, STEP2_ID]
              : lid === LESSON2_ID
                ? [STEP3_ID, STEP4_ID]
                : lid === LESSON3_ID
                  ? [STEP5_ID, STEP6_ID]
                  : lid === LESSON4_ID
                    ? [STEP7_ID, STEP8_ID]
                    : [];
          result[lid] = ids.map((sid) => ({
            uuid: sid,
            description: (allSteps[sid]?.description as string) ?? '',
          }));
        }
        return result;
      }
      return undefined;
    });

    const mockUiApp = {
      getAction: mock(() => {
        throw new Error('not found');
      }),
      getController: mock(() => undefined),
    };

    const story = new NavTreeStory();
    story.init({ appApi: { execute: appApiSpy }, uiApp: mockUiApp } as never);
    return { story, appApiSpy };
  }

  // ── Уровень 1: список проектов ──

  test('my-study:lessons — показывает проекты с прогрессом (sendMessage)', async () => {
    const { story } = makeStory();

    const response = await story.handleCallback(
      'my-study:lessons',
      studentActor,
      session,
    );

    // Первый вход — новое сообщение
    expect(response.sendMessage).toBeDefined();
    expect(response.editMessage).toBeUndefined();

    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('📂');
    expect(text).toContain('Уроки');
    expect(text).toContain('Основы');
    expect(text).toContain('Продвинутый');

    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btnTexts.some((t) => t.includes('Основы'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Продвинутый'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Назад к учёбе'))).toBe(true);
  });

  // ── Уровень 2: уроки проекта ──

  test('my-study:project:1 — показывает уроки проекта (editMessage)', async () => {
    const { story } = makeStory();

    const response = await story.handleCallback(
      'my-study:project:1',
      studentActor,
      richSession,
    );

    // Переход внутри дерева — editMessage
    expect(response.editMessage).toBeDefined();
    expect(response.sendMessage).toBeUndefined();
    expect(response.editMessage?.messageId).toBe(42);

    const text = response.editMessage?.text ?? '';
    expect(text).toContain('Основы');
    expect(text).toContain('Введение');

    const btnTexts =
      response.editMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btnTexts.some((t) => t.includes('Введение'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Переменные'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Назад к проектам'))).toBe(true);
  });

  // ── Уровень 3: шаги урока ──

  test('my-study:lesson:{id} — показывает шаги с маркерами (editMessage)', async () => {
    const { story } = makeStory();

    const response = await story.handleCallback(
      `my-study:lesson:${LESSON1_ID}`,
      studentActor,
      richSession,
    );

    const text = response.editMessage?.text ?? '';
    // Все шаги completed в уроке 1
    expect(text).toContain('✅');
    expect(text).toContain('Первый шаг');
    expect(text).toContain('Второй шаг');

    const btnTexts =
      response.editMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btnTexts.some((t) => t.includes('Первый шаг'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Второй шаг'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Назад к урокам'))).toBe(true);
  });

  test('my-study:lesson:{id} — 🔒-шаги не показываются кнопками', async () => {
    const { story } = makeStory();

    // Урок «Функции» — все шаги будущие (нет в steps)
    const response = await story.handleCallback(
      `my-study:lesson:${LESSON3_ID}`,
      studentActor,
      richSession,
    );

    const text = response.editMessage?.text ?? '';
    expect(text).toContain('🔒');

    const btnTexts =
      response.editMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    const stepButtons = btnTexts.filter(
      (t) => !t.includes('Назад') && !t.includes('Выберите'),
    );
    expect(stepButtons.length).toBe(0);
  });

  test('my-study:lesson:{id} — кнопка ▶️ для текущего шага', async () => {
    const { story } = makeStory();

    // Урок «Переменные»: STEP3 completed, STEP4 issued (текущий)
    const response = await story.handleCallback(
      `my-study:lesson:${LESSON2_ID}`,
      studentActor,
      richSession,
    );

    const text = response.editMessage?.text ?? '';
    expect(text).toContain('▶️');

    const btnTexts =
      response.editMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btnTexts.some((t) => t.includes('Третий шаг'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Четвёртый шаг'))).toBe(true);
  });

  // ── Возвраты ──

  test('«⬅️ Назад к проектам» → editMessage с уровнем 1', async () => {
    const { story } = makeStory();

    // my-study:lessons с сессией → editMessage
    const response = await story.handleCallback(
      'my-study:lessons',
      studentActor,
      richSession,
    );

    expect(response.editMessage).toBeDefined();
    expect(response.sendMessage).toBeUndefined();

    const text = response.editMessage?.text ?? '';
    expect(text).toContain('Уроки');
    expect(text).toContain('Основы');
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
