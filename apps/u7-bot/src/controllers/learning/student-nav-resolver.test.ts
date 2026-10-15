import { describe, expect, test } from 'bun:test';
import type { ContentSnapshot } from '@u7-scl/course/domain';
import type { Student } from '@u7-scl/stream/domain';
import { resolveStudentNavLevel } from './student-nav-resolver';

describe('student-nav-resolver (TDD)', () => {
  const STREAM_ID = 'stream-111';
  const STEP1_ID = 'step-uuid-1';
  const STEP2_ID = 'step-uuid-2';
  const STEP3_ID = 'step-uuid-3';
  const STEP4_ID = 'step-uuid-4';
  const STEP5_ID = 'step-uuid-5';

  const LESSON1_ID = 'lesson-uuid-1';
  const LESSON2_ID = 'lesson-uuid-2';
  const LESSON3_ID = 'lesson-uuid-3';

  const PROJECT1_ID = 'project-uuid-1';
  const PROJECT2_ID = 'project-uuid-2';

  const snapshot: ContentSnapshot = [
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
          stepIds: [STEP5_ID],
        },
      ],
    },
  ];

  // Студент завершил шаг 1, шаг 2 текущий, остальные заблокированы
  const student: Student = {
    uuid: 'student-1',
    streamId: STREAM_ID,
    userId: 'user-1',
    status: 'active',
    enrolledAt: '2026-01-01T00:00:00.000Z',
    createdAt: '2026-01-01T00:00:00.000Z',
    currentStepId: STEP2_ID,
    steps: [
      {
        stepId: STEP1_ID,
        status: 'completed',
        issuedAt: '2026-01-01',
        completedAt: '2026-01-02',
      },
      {
        stepId: STEP2_ID,
        status: 'issued',
        issuedAt: '2026-01-02',
      },
    ],
  };

  const stepsDescriptions: Record<string, string> = {
    [STEP1_ID]: 'Установка окружения',
    [STEP2_ID]: 'Первая программа',
    [STEP3_ID]: 'Объявление переменных',
    [STEP4_ID]: 'Типы данных',
    [STEP5_ID]: 'Создание функций',
  };

  const stepContents: Record<
    string,
    { kind: string; content?: string; code?: string }
  > = {
    [STEP1_ID]: {
      kind: 'text',
      content: 'Инструкция по установке окружения.',
    },
    [STEP2_ID]: {
      kind: 'code',
      code: 'console.log("Hello, world!");',
    },
  };

  test('[Red] root уровень: список проектов с прогрессом уроков', () => {
    const level = resolveStudentNavLevel({
      story: 'nav-tree',
      address: { level: 'root' },
      snapshot,
      student,
      stepDescriptions: stepsDescriptions,
    });

    expect(level).toBeDefined();
    expect(level?.breadcrumbs).toEqual(['📂 Уроки']);
    expect(level?.children).toHaveLength(2);

    // Проект 1: в процессе, уроки как подуровни
    const p1 = level?.children?.[0];
    expect(p1?.id).toBe(PROJECT1_ID);
    expect(p1?.title).toBe('Проект: Основы');
    expect(p1?.status).toBe('in_progress');
    expect(p1?.enterable).toBe(true);
    expect(p1?.children).toHaveLength(2);
    expect(p1?.children?.[0]?.title).toBe('Урок: Введение');
    expect(p1?.children?.[0]?.status).toBe('in_progress');

    // Проект 2: заблокирован
    const p2 = level?.children?.[1];
    expect(p2?.id).toBe(PROJECT2_ID);
    expect(p2?.title).toBe('Проект: Продвинутый');
    expect(p2?.status).toBe('locked');
  });

  test('[Red] project уровень: список уроков с подуровнями шагов и листанием проектов', () => {
    const level = resolveStudentNavLevel({
      story: 'nav-tree',
      address: { level: 'project', targetId: PROJECT1_ID },
      snapshot,
      student,
      stepDescriptions: stepsDescriptions,
    });

    expect(level).toBeDefined();
    expect(level?.breadcrumbs).toEqual(['📂 Уроки', 'Проект: Основы']);
    expect(level?.title).toBe('Основы');
    expect(level?.children).toHaveLength(2);

    const l1 = level?.children?.[0];
    expect(l1?.id).toBe(LESSON1_ID);
    expect(l1?.title).toBe('Урок: Введение');
    expect(l1?.children).toHaveLength(2);
    expect(l1?.children?.[0]?.title).toBe('Шаг: Установка окружения');
    expect(l1?.children?.[0]?.status).toBe('completed');
    expect(l1?.children?.[1]?.title).toBe('Шаг: Первая программа');
    expect(l1?.children?.[1]?.status).toBe('in_progress');

    // Навигация соседей между проектами: у проекта 1 есть next (проект 2), но нет prev
    expect(level?.prev).toBeUndefined();
    expect(level?.next).toEqual({
      address: `nav-tree:project:${PROJECT2_ID}`,
    });
    const backAddress =
      typeof level?.back === 'object' ? level.back.address : level?.back;
    expect(backAddress).toBe('nav-tree:root');
  });

  test('[Red] lesson уровень: список шагов, доступность шагов (enterable)', () => {
    const level = resolveStudentNavLevel({
      story: 'nav-tree',
      address: { level: 'lesson', targetId: LESSON1_ID },
      snapshot,
      student,
      stepDescriptions: stepsDescriptions,
    });

    expect(level).toBeDefined();
    expect(level?.breadcrumbs).toEqual([
      '📂 Уроки',
      'Проект: Основы',
      'Урок: Введение',
    ]);
    expect(level?.children).toHaveLength(2);

    // Шаг 1 пройден → enterable: true
    const s1 = level?.children?.[0];
    expect(s1?.id).toBe(STEP1_ID);
    expect(s1?.status).toBe('completed');
    expect(s1?.enterable).toBe(true);

    // Шаг 2 текущий → enterable: true
    const s2 = level?.children?.[1];
    expect(s2?.id).toBe(STEP2_ID);
    expect(s2?.status).toBe('in_progress');
    expect(s2?.enterable).toBe(true);

    // Соседи урока в рамках проекта: следующий — LESSON2_ID
    expect(level?.prev).toBeUndefined();
    expect(level?.next).toEqual({
      address: `nav-tree:lesson:${LESSON2_ID}`,
    });
    const backAddress =
      typeof level?.back === 'object' ? level.back.address : level?.back;
    expect(backAddress).toBe(`nav-tree:project:${PROJECT1_ID}`);
  });

  test('[Red] step уровень (доступный шаг): тело шага, статус, листание только по доступным', () => {
    const level = resolveStudentNavLevel({
      story: 'nav-tree',
      address: { level: 'step', targetId: STEP1_ID },
      snapshot,
      student,
      stepDescriptions: stepsDescriptions,
      stepContent: stepContents[STEP1_ID],
    });

    expect(level).toBeDefined();
    expect(level?.breadcrumbs).toEqual([
      '📂 Уроки',
      'Проект: Основы',
      'Урок: Введение',
      'Шаг: Установка окружения',
    ]);
    expect(level?.status).toBe('completed');
    expect(level?.statusLabel).toBe('Пройден');
    expect(level?.body).toContain('Инструкция по установке окружения');

    // Листание: у шага 1 нет предыдущего шага, но следующий шаг 2 доступен (текущий)
    expect(level?.prev).toBeUndefined();
    expect(level?.next).toEqual({
      address: `nav-tree:step:${STEP2_ID}`,
    });
    const backAddress =
      typeof level?.back === 'object' ? level.back.address : level?.back;
    expect(backAddress).toBe(`nav-tree:lesson:${LESSON1_ID}`);
  });

  test('[Red] step уровень (текущий шаг): следующий заблокированный шаг НЕ отображается в next', () => {
    // В уроке 1 всего 2 шага, шаг 2 последний, а шаг 3 в следующем уроке заблокирован.
    // На шаге 2 next должен быть undefined!
    const level = resolveStudentNavLevel({
      story: 'nav-tree',
      address: { level: 'step', targetId: STEP2_ID },
      snapshot,
      student,
      stepDescriptions: stepsDescriptions,
      stepContent: stepContents[STEP2_ID],
    });

    expect(level).toBeDefined();
    expect(level?.status).toBe('in_progress');
    expect(level?.statusLabel).toBe('В процессе');
    expect(level?.prev).toEqual({
      address: `nav-tree:step:${STEP1_ID}`,
    });
    expect(level?.next).toBeUndefined();
  });

  test('[Red] step уровень (заблокированный шаг): возвращает null или fallback (нет доступа)', () => {
    const level = resolveStudentNavLevel({
      story: 'nav-tree',
      address: { level: 'step', targetId: STEP3_ID },
      snapshot,
      student,
      stepDescriptions: stepsDescriptions,
    });

    // Заблокированный шаг недоступен для прямого просмотра
    expect(level).toBeNull();
  });
});
