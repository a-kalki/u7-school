import { describe, expect, mock, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import type { BotSession } from '@u7-scl/core/ui';
import { assertDialogResponseMarkdownSafe } from '@u7-scl/core/ui';
import { Role } from '@u7-scl/user/domain';
import { NavTreeStory } from './nav-tree';

describe('NavTreeStory — drill-down навигация студента (TDD)', () => {
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

  const PROJECT1_ID = 'project-uuid-1';
  const PROJECT2_ID = 'project-uuid-2';

  const session: BotSession = {
    dialog: { path: 'learning/nav-tree', seq: 1 },
  };

  const richSnapshot = [
    {
      projectId: PROJECT1_ID,
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
      projectId: PROJECT2_ID,
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
    enrolledAt: '2026-01-01T00:00:00.000Z',
    createdAt: '2026-01-01T00:00:00.000Z',
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
    title: 'Веб-разработка',
    contentSnapshot: richSnapshot,
  };

  function makeStory(appApiOverrides?: Record<string, unknown>) {
    const allSteps: Record<string, Record<string, unknown>> = {
      [STEP1_ID]: {
        uuid: STEP1_ID,
        description: 'Первый шаг',
        kind: 'text',
        content: 'Контент первого шага',
        status: 'published',
        createdAt: '2026-01-01',
      },
      [STEP2_ID]: {
        uuid: STEP2_ID,
        description: 'Второй шаг',
        kind: 'text',
        content: 'Контент второго шага',
        status: 'published',
        createdAt: '2026-01-02',
      },
      [STEP3_ID]: {
        uuid: STEP3_ID,
        description: 'Третий шаг',
        kind: 'code',
        code: 'const x = 1;',
        status: 'published',
        createdAt: '2026-01-03',
      },
      [STEP4_ID]: {
        uuid: STEP4_ID,
        description: 'Четвёртый шаг',
        kind: 'text',
        content: 'Контент четвёртого шага',
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

    const story = new NavTreeStory();
    story.init({ appApi: { execute: appApiSpy } } as never);
    return { story, appApiSpy };
  }

  // ── Уровень 1: Root (Модуль / Проекты) ──

  test('my-study:lessons / nav-tree:root — экран проектов с хлебными крошками и подуровнями', async () => {
    const { story } = makeStory();

    const response = await story.handleCallback(
      'my-study:lessons',
      studentActor,
      session,
    );
    assertDialogResponseMarkdownSafe(response);

    const text = String(response.screen?.text);
    expect(text).toContain('📂 *Уроки*');
    expect(text).toContain('1\\. *Основы*');
    expect(text).toContain('Введение');
    expect(text).toContain('Переменные');
    expect(text).toContain('2\\. *Продвинутый*');

    const flatBtns = response.screen?.keyboard?.rows.flat() ?? [];
    // Кнопка проекта содержит UUID проекта
    const projectBtn = flatBtns.find((b) => b.text.includes('Основы'));
    expect(projectBtn).toBeDefined();
    expect(projectBtn?.code).toBe(`nav-tree:project:${PROJECT1_ID}`);

    const backBtn = flatBtns.find((b) => b.text.includes('Назад к учёбе'));
    expect(backBtn).toBeDefined();
  });

  // ── Уровень 2: Project (Проект / Уроки) ──

  test('nav-tree:project:<id> — экран уроков проекта с подуровнями шагов и листанием проектов', async () => {
    const { story } = makeStory();

    const response = await story.handleCallback(
      `nav-tree:project:${PROJECT1_ID}`,
      studentActor,
      session,
    );
    assertDialogResponseMarkdownSafe(response);

    const text = String(response.screen?.text);
    expect(text).toContain('📂 *Уроки* › Основы');
    expect(text).toContain('1\\. *Введение*');
    expect(text).toContain('Первый шаг');
    expect(text).toContain('2\\. *Переменные*');

    const flatBtns = response.screen?.keyboard?.rows.flat() ?? [];
    // Кнопки уроков ведут в nav-tree:lesson:<lessonId>
    const lesson1Btn = flatBtns.find((b) => b.text.includes('Введение'));
    expect(lesson1Btn?.code).toBe(`nav-tree:lesson:${LESSON1_ID}`);

    // Навигация соседей: проект 1 имеет следующий проект
    const nextBtn = flatBtns.find((b) => b.text.includes('След. ▶️'));
    expect(nextBtn?.code).toBe(`nav-tree:project:${PROJECT2_ID}`);

    // Кнопка назад в корень
    const backBtn = flatBtns.find((b) => b.text.includes('Назад к проектам'));
    expect(backBtn?.code).toBe('nav-tree:root');
  });

  // ── Уровень 3: Lesson (Урок / Шаги) ──

  test('nav-tree:lesson:<id> — экран шагов с маркерами, кнопки только для доступных шагов', async () => {
    const { story } = makeStory();

    // В уроке 2: STEP3 completed (✅), STEP4 issued (▶️)
    const response = await story.handleCallback(
      `nav-tree:lesson:${LESSON2_ID}`,
      studentActor,
      session,
    );
    assertDialogResponseMarkdownSafe(response);

    const text = String(response.screen?.text);
    expect(text).toContain('📂 *Уроки* › Основы › Переменные');
    expect(text).toContain('1\\. ✅ Третий шаг');
    expect(text).toContain('2\\. ▶️ Четвёртый шаг');

    const flatBtns = response.screen?.keyboard?.rows.flat() ?? [];
    // Кнопки доступных шагов ведут в карточки шагов drill-down nav-tree:step:<stepId>
    const step3Btn = flatBtns.find((b) => b.text.includes('Третий шаг'));
    expect(step3Btn?.code).toBe(`nav-tree:step:${STEP3_ID}`);

    const step4Btn = flatBtns.find((b) => b.text.includes('Четвёртый шаг'));
    expect(step4Btn?.code).toBe(`nav-tree:step:${STEP4_ID}`);

    // Соседи в рамках проекта: пред. урок — Введение
    const prevLessonBtn = flatBtns.find((b) => b.text.includes('◀️ Пред.'));
    expect(prevLessonBtn?.code).toBe(`nav-tree:lesson:${LESSON1_ID}`);

    // Кнопка назад в проект
    const backBtn = flatBtns.find((b) => b.text.includes('Назад к урокам'));
    expect(backBtn?.code).toBe(`nav-tree:project:${PROJECT1_ID}`);
  });

  test('nav-tree:lesson:<id> — 🔒 заблокированные шаги не имеют кнопок перехода', async () => {
    const { story } = makeStory();

    // В уроке 3 (Функции): все шаги 🔒 заблокированы
    const response = await story.handleCallback(
      `nav-tree:lesson:${LESSON3_ID}`,
      studentActor,
      session,
    );
    assertDialogResponseMarkdownSafe(response);

    const text = String(response.screen?.text);
    expect(text).toContain('🔒');

    const flatBtns = response.screen?.keyboard?.rows.flat() ?? [];
    // Кнопок для заблокированных шагов нет
    const stepBtns = flatBtns.filter(
      (b) => b.text.includes('Пятый шаг') || b.text.includes('Шестой шаг'),
    );
    expect(stepBtns).toHaveLength(0);
  });

  // ── Уровень 4: Step (Шаг карточка drill-down) ──

  test('nav-tree:step:<id> — карточка шага: крошки, статус, тело, без кнопки «Выполнено»', async () => {
    const { story } = makeStory();

    // Пройденный шаг 1
    const response = await story.handleCallback(
      `nav-tree:step:${STEP1_ID}`,
      studentActor,
      session,
    );
    assertDialogResponseMarkdownSafe(response);

    const text = String(response.screen?.text);
    expect(text).toContain('📂 *Уроки* › Основы › Введение › Шаг 1');
    expect(text).toContain('✅ Пройден');
    expect(text).toContain('Контент первого шага');

    const flatBtns = response.screen?.keyboard?.rows.flat() ?? [];
    // Никакой кнопки «Выполнено» в drill-down нет!
    expect(flatBtns.some((b) => b.text.includes('Выполнено'))).toBe(false);

    // Листание: следующий шаг 2 доступен (в том же уроке)
    const nextBtn = flatBtns.find((b) => b.text.includes('След. ▶️'));
    expect(nextBtn?.code).toBe(`nav-tree:step:${STEP2_ID}`);

    // Кнопка назад в урок
    const backBtn = flatBtns.find((b) => b.text.includes('Назад к уроку'));
    expect(backBtn?.code).toBe(`nav-tree:lesson:${LESSON1_ID}`);
  });

  test('nav-tree:step:<id> — на текущем шаге «След. ▶️» исчезает, если следующий шаг заблокирован', async () => {
    const { story } = makeStory();

    // STEP4 — текущий шаг в уроке 2. Он последний в уроке, следующий шаг в уроке 3 заблокирован
    const response = await story.handleCallback(
      `nav-tree:step:${STEP4_ID}`,
      studentActor,
      session,
    );
    assertDialogResponseMarkdownSafe(response);

    const text = String(response.screen?.text);
    expect(text).toContain('▶️ В процессе');

    const flatBtns = response.screen?.keyboard?.rows.flat() ?? [];
    // Нет кнопки След. ▶️
    expect(flatBtns.some((b) => b.text.includes('След. ▶️'))).toBe(false);

    // Есть кнопка ◀️ Пред. на STEP3
    const prevBtn = flatBtns.find((b) => b.text.includes('◀️ Пред.'));
    expect(prevBtn?.code).toBe(`nav-tree:step:${STEP3_ID}`);
  });

  test('nav-tree:step:<id> — прямой запрос заблокированного шага возвращает ошибку/отказ', async () => {
    const { story } = makeStory();

    // STEP5 — заблокирован
    const response = await story.handleCallback(
      `nav-tree:step:${STEP5_ID}`,
      studentActor,
      session,
    );

    const text = String(response.screen?.text);
    expect(text).toContain('не найден или недоступен');
  });

  // ── Обратная совместимость алиасов ──

  test('обратная совместимость: my-study:project:<index> открывает нужный проект', async () => {
    const { story } = makeStory();

    const response = await story.handleCallback(
      'my-study:project:1',
      studentActor,
      session,
    );
    assertDialogResponseMarkdownSafe(response);

    const text = String(response.screen?.text);
    expect(text).toContain('Основы');
  });

  test('студент не записан — экран «не записаны»', async () => {
    const { story } = makeStory({
      'get-student-by-user': (() => {
        throw new Error('not found');
      }) as unknown,
    });

    const response = await story.handleCallback(
      'my-study:lessons',
      studentActor,
      session,
    );

    expect(String(response.screen?.text)).toContain('не записаны');
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
