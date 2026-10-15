import { describe, expect, test } from 'bun:test';
import type { ContentSnapshot } from '@u7-scl/course/domain';
import { type Stream, StreamStatus } from '@u7-scl/stream/domain';
import { resolveStreamNavLevel } from './stream-nav-resolver';

describe('stream-nav-resolver (TDD)', () => {
  const STREAM_ID = '11111111-1111-4111-8111-111111111111';
  const STEP1_ID = 'step-uuid-1';
  const STEP2_ID = 'step-uuid-2';
  const STEP3_ID = 'step-uuid-3';
  const STEP4_ID = 'step-uuid-4';

  const LESSON1_ID = 'lesson-uuid-1';
  const LESSON2_ID = 'lesson-uuid-2';

  const PROJECT1_ID = 'project-uuid-1';
  const PROJECT2_ID = 'project-uuid-2';

  const snapshot: ContentSnapshot = [
    {
      projectId: PROJECT1_ID,
      projectTitle: 'Введение в web',
      lessons: [
        {
          lessonId: LESSON1_ID,
          lessonTitle: 'Как устроен web',
          stepIds: [STEP1_ID, STEP2_ID],
        },
        {
          lessonId: LESSON2_ID,
          lessonTitle: 'Фронтенд и бэкенд',
          stepIds: [STEP3_ID],
        },
      ],
    },
    {
      projectId: PROJECT2_ID,
      projectTitle: 'Инфраструктура',
      lessons: [
        {
          lessonId: 'lesson-uuid-3',
          lessonTitle: 'Настройка редактора',
          stepIds: [STEP4_ID],
        },
      ],
    },
  ];

  const stream: Stream = {
    uuid: '11111111-1111-4111-8111-111111111111',
    schoolId: '22222222-2222-4222-8222-222222222222',
    moduleId: '33333333-3333-4333-8333-333333333333',
    mentorId: '44444444-4444-4444-8444-444444444444',
    title: 'Веб-разработка с нуля',
    description: 'Описание потока',
    status: StreamStatus.ACTIVE,
    startDate: '2026-02-01T00:00:00.000Z',
    contentSnapshot: snapshot,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  const stepDescriptions: Record<string, string> = {
    [STEP1_ID]: 'Протоколы HTTP и HTTPS',
    [STEP2_ID]: 'DNS и IP адреса',
    [STEP3_ID]: 'Клиент-серверная архитектура',
    [STEP4_ID]: 'Установка VS Code',
  };

  const stepBodies: Record<string, string> = {
    [STEP1_ID]: 'HTTP — это протокол передачи гипертекста.',
    [STEP2_ID]: 'console.log("DNS lookup");',
  };

  test('[Red] root уровень (ментор): список проектов без статусов и прогресса', () => {
    const level = resolveStreamNavLevel({
      stream,
      story: `view-stream-mentor:prog:${STREAM_ID}`,
      rootBackAddress: `view-stream-mentor:view:${STREAM_ID}`,
      address: { level: 'root' },
      mode: 'mentor',
      stepDescriptions,
    });

    expect(level).toBeDefined();
    expect(level?.breadcrumbs).toEqual(['📖 Программа модуля']);
    expect(level?.children).toHaveLength(2);

    // Проект 1: без статуса, доступен для перехода
    const p1 = level?.children?.[0];
    expect(p1?.id).toBe(PROJECT1_ID);
    expect(p1?.title).toBe('Введение в web');
    expect(p1?.status).toBeUndefined();
    expect(p1?.enterable).toBe(true);
    expect(p1?.address).toBe(
      `view-stream-mentor:prog:${STREAM_ID}:project:${PROJECT1_ID}`,
    );

    // Дочерние уроки в превью проекта: без статусов
    expect(p1?.children).toHaveLength(2);
    expect(p1?.children?.[0]?.title).toBe('Как устроен web');
    expect(p1?.children?.[0]?.status).toBeUndefined();

    // Возврат к потоку на уровне root
    expect(level?.back).toEqual({
      label: '⬅️ Назад к потоку',
      address: `view-stream-mentor:view:${STREAM_ID}`,
    });
  });

  test('[Red] project уровень (ментор): список уроков и листание проектов', () => {
    const level = resolveStreamNavLevel({
      stream,
      story: `view-stream-mentor:prog:${STREAM_ID}`,
      address: { level: 'project', targetId: PROJECT1_ID },
      mode: 'mentor',
      stepDescriptions,
    });

    expect(level).toBeDefined();
    expect(level?.breadcrumbs).toEqual([
      '📖 Программа модуля',
      'Введение в web',
    ]);
    expect(level?.title).toBe('Введение в web');
    expect(level?.children).toHaveLength(2);

    const l1 = level?.children?.[0];
    expect(l1?.id).toBe(LESSON1_ID);
    expect(l1?.title).toBe('Как устроен web');
    expect(l1?.status).toBeUndefined();
    expect(l1?.enterable).toBe(true);
    expect(l1?.address).toBe(
      `view-stream-mentor:prog:${STREAM_ID}:lesson:${LESSON1_ID}`,
    );

    // Навигация соседей между проектами
    expect(level?.prev).toBeUndefined();
    expect(level?.next).toEqual({
      label: 'След. проект ▶️',
      address: `view-stream-mentor:prog:${STREAM_ID}:project:${PROJECT2_ID}`,
    });

    // Возврат к модулю
    expect(level?.back).toEqual({
      label: '⬅️ Назад к модулю',
      address: `view-stream-mentor:prog:${STREAM_ID}:root`,
    });
  });

  test('[Red] lesson уровень (ментор): все шаги открыты для чтения', () => {
    const level = resolveStreamNavLevel({
      stream,
      story: `view-stream-mentor:prog:${STREAM_ID}`,
      address: { level: 'lesson', targetId: LESSON1_ID },
      mode: 'mentor',
      stepDescriptions,
    });

    expect(level).toBeDefined();
    expect(level?.breadcrumbs).toEqual([
      '📖 Программа модуля',
      'Введение в web',
      'Как устроен web',
    ]);
    expect(level?.children).toHaveLength(2);

    // В менторском режиме все шаги enterable: true
    const s1 = level?.children?.[0];
    expect(s1?.id).toBe(STEP1_ID);
    expect(s1?.title).toBe('Протоколы HTTP и HTTPS');
    expect(s1?.status).toBeUndefined();
    expect(s1?.enterable).toBe(true);
    expect(s1?.address).toBe(
      `view-stream-mentor:prog:${STREAM_ID}:step:${STEP1_ID}`,
    );

    const s2 = level?.children?.[1];
    expect(s2?.id).toBe(STEP2_ID);
    expect(s2?.title).toBe('DNS и IP адреса');
    expect(s2?.status).toBeUndefined();
    expect(s2?.enterable).toBe(true);

    // Навигация между уроками проекта
    expect(level?.prev).toBeUndefined();
    expect(level?.next).toEqual({
      label: 'След. урок ▶️',
      address: `view-stream-mentor:prog:${STREAM_ID}:lesson:${LESSON2_ID}`,
    });

    // Возврат к проекту
    expect(level?.back).toEqual({
      label: '⬅️ Назад к проекту',
      address: `view-stream-mentor:prog:${STREAM_ID}:project:${PROJECT1_ID}`,
    });
  });

  test('[Red] step уровень (ментор): readOnly карточка шага с телом и навигацией', () => {
    const level = resolveStreamNavLevel({
      stream,
      story: `view-stream-mentor:prog:${STREAM_ID}`,
      address: { level: 'step', targetId: STEP1_ID },
      mode: 'mentor',
      stepDescriptions,
      stepBodies,
    });

    expect(level).toBeDefined();
    expect(level?.breadcrumbs).toEqual([
      '📖 Программа модуля',
      'Введение в web',
      'Как устроен web',
      'Шаг 1',
    ]);
    expect(level?.title).toBe('Протоколы HTTP и HTTPS');
    expect(level?.body).toBe(stepBodies[STEP1_ID]);
    expect(level?.status).toBeUndefined();

    // Навигация между шагами
    expect(level?.prev).toBeUndefined();
    expect(level?.next).toEqual({
      label: 'След. шаг ▶️',
      address: `view-stream-mentor:prog:${STREAM_ID}:step:${STEP2_ID}`,
    });

    // Возврат к уроку
    expect(level?.back).toEqual({
      label: '⬅️ Назад к уроку',
      address: `view-stream-mentor:prog:${STREAM_ID}:lesson:${LESSON1_ID}`,
    });
  });

  test('[Red] viewer режим (публичный гость): шаги урока не имеют enterable, вход в step запрещён', () => {
    const lessonLevel = resolveStreamNavLevel({
      stream,
      story: `view-stream:prog:${STREAM_ID}`,
      address: { level: 'lesson', targetId: LESSON1_ID },
      mode: 'viewer',
      stepDescriptions,
    });

    expect(lessonLevel).toBeDefined();
    // В режиме viewer шаги не имеют адреса и enterable: false
    const s1 = lessonLevel?.children?.[0];
    expect(s1?.enterable).toBe(false);
    expect(s1?.address).toBeUndefined();

    // Попытка открыть шаг напрямую в режиме viewer возвращает null
    const stepLevel = resolveStreamNavLevel({
      stream,
      story: `view-stream:prog:${STREAM_ID}`,
      address: { level: 'step', targetId: STEP1_ID },
      mode: 'viewer',
      stepDescriptions,
      stepBodies,
    });

    expect(stepLevel).toBeNull();
  });
});
