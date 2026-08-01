import { describe, expect, test } from 'bun:test';
import type { ContentSnapshot } from '@u7-scl/course/domain';
import { StreamAr } from './stream/a-root';
import { StreamDs } from './stream-ds';
import { StudentAr } from './student/a-root';

const _mockStreamId = '11111111-1111-4111-8111-111111111111';
const mockUserId = '22222222-2222-4222-8222-222222222222';
const mockMentorId = '33333333-3333-4333-8333-333333333333';
const mockModuleId = '44444444-4444-4444-8444-444444444444';

const snapshot: ContentSnapshot = [
  {
    projectId: '55555555-5555-4555-8555-555555555555',
    projectTitle: 'П1',
    lessons: [
      {
        lessonId: '66666666-6666-4666-8666-666666666666',
        lessonTitle: 'У1',
        stepIds: [
          '77777777-7777-4777-8777-777777777777',
          '88888888-8888-4888-8888-888888888888',
        ],
      },
    ],
  },
];

/** Многопроектный снимок для тестирования уровней lesson/project */
const multiSnapshot: ContentSnapshot = [
  {
    projectId: '55555555-5555-4555-8555-555555555555',
    projectTitle: 'П1',
    lessons: [
      {
        lessonId: '66666666-6666-4666-8666-666666666666',
        lessonTitle: 'У1.1',
        stepIds: [
          '77777777-7777-4777-8777-777777777777',
          '88888888-8888-4888-8888-888888888888',
        ],
      },
      {
        lessonId: '99999999-9999-4999-8999-999999999999',
        lessonTitle: 'У1.2',
        stepIds: ['aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'],
      },
    ],
  },
  {
    projectId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    projectTitle: 'П2',
    lessons: [
      {
        lessonId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
        lessonTitle: 'У2.1',
        stepIds: ['dddddddd-dddd-4ddd-8ddd-dddddddddddd'],
      },
    ],
  },
];

const mockCreateCmd = {
  title: 'Поток',
  description: 'Описание',
  mentorId: mockMentorId,
  moduleId: mockModuleId,
  startDate: '2026-06-01T12:00',
};

describe('StreamDs.completeStep', () => {
  test('завершает шаг, находит следующий и выдаёт его (уровень step)', () => {
    const stream = StreamAr.create(mockCreateCmd, snapshot);
    stream.activate();
    const student = StudentAr.enroll(
      stream.state.uuid,
      mockUserId,
      '77777777-7777-4777-8777-777777777777',
    );
    student.issueStep('77777777-7777-4777-8777-777777777777');

    const result = StreamDs.completeStep(
      stream,
      student,
      '77777777-7777-4777-8777-777777777777',
    );

    expect(result).toEqual({
      level: 'step',
      currentStepId: '88888888-8888-4888-8888-888888888888',
    });
    expect(
      student.state.steps.find(
        (s) => s.stepId === '77777777-7777-4777-8777-777777777777',
      )?.status,
    ).toBe('completed');
    expect(
      student.state.steps.find(
        (s) => s.stepId === '88888888-8888-4888-8888-888888888888',
      )?.status,
    ).toBe('issued');
  });

  test('при завершении последнего шага потока — студент completed', () => {
    const stream = StreamAr.create(mockCreateCmd, snapshot);
    stream.activate();
    const student = StudentAr.enroll(
      stream.state.uuid,
      mockUserId,
      '88888888-8888-4888-8888-888888888888',
    );
    student.issueStep('88888888-8888-4888-8888-888888888888');

    const result = StreamDs.completeStep(
      stream,
      student,
      '88888888-8888-4888-8888-888888888888',
    );

    expect(result).toEqual({ level: 'stream', completed: true });
    // Статус студента не меняется автоматически — его изменит ментор через CompleteStudentUc
    expect(student.state.status).toBe('enrolled');
  });
});

describe('StreamDs.completeStep — определение уровней (многопроектный)', () => {
  const multiStream = () => {
    const s = StreamAr.create(mockCreateCmd, multiSnapshot);
    s.activate();
    return s;
  };

  test('уровень step: следующий шаг в том же уроке', () => {
    const stream = multiStream();
    const student = StudentAr.enroll(
      stream.state.uuid,
      mockUserId,
      '77777777-7777-4777-8777-777777777777',
    );
    student.issueStep('77777777-7777-4777-8777-777777777777');

    const result = StreamDs.completeStep(
      stream,
      student,
      '77777777-7777-4777-8777-777777777777',
    );

    expect(result).toEqual({
      level: 'step',
      currentStepId: '88888888-8888-4888-8888-888888888888',
    });
  });

  test('уровень lesson: последний шаг урока, переход на следующий урок', () => {
    const stream = multiStream();
    const student = StudentAr.enroll(
      stream.state.uuid,
      mockUserId,
      '88888888-8888-4888-8888-888888888888',
    );
    student.issueStep('88888888-8888-4888-8888-888888888888');

    const result = StreamDs.completeStep(
      stream,
      student,
      '88888888-8888-4888-8888-888888888888',
    );

    expect(result).toEqual({
      level: 'lesson',
      currentStepId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      completedLessonId: '66666666-6666-4666-8666-666666666666',
    });
  });

  test('уровень project: последний шаг последнего урока, переход на следующий проект', () => {
    const stream = multiStream();
    const student = StudentAr.enroll(
      stream.state.uuid,
      mockUserId,
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    );
    student.issueStep('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');

    const result = StreamDs.completeStep(
      stream,
      student,
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    );

    expect(result).toEqual({
      level: 'project',
      currentStepId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
      completedProjectId: '55555555-5555-4555-8555-555555555555',
    });
  });

  test('уровень stream: последний шаг последнего проекта', () => {
    const stream = multiStream();
    const student = StudentAr.enroll(
      stream.state.uuid,
      mockUserId,
      'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    );
    student.issueStep('dddddddd-dddd-4ddd-8ddd-dddddddddddd');

    const result = StreamDs.completeStep(
      stream,
      student,
      'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    );

    expect(result).toEqual({ level: 'stream', completed: true });
    // Статус студента не меняется автоматически — его изменит ментор через CompleteStudentUc
    expect(student.state.status).toBe('enrolled');
  });
});

// ── Новые методы: навигация и прогресс ──

function studentWithSteps(overrides?: {
  currentStepId?: string;
  completed?: string[];
  issued?: string[];
}) {
  return {
    steps: [
      ...(overrides?.completed ?? []).map((stepId) => ({
        stepId,
        status: 'completed' as const,
        issuedAt: '2026-06-01T00:00',
        completedAt: '2026-06-01T01:00',
      })),
      ...(overrides?.issued ?? []).map((stepId) => ({
        stepId,
        status: 'issued' as const,
        issuedAt: '2026-06-01T00:00',
      })),
    ],
    currentStepId: overrides?.currentStepId ?? '',
  };
}

describe('StreamDs.computeProgress', () => {
  test('0/2 — студент только начал', () => {
    const student = studentWithSteps({
      issued: ['77777777-7777-4777-8777-777777777777'],
      currentStepId: '77777777-7777-4777-8777-777777777777',
    });

    const result = StreamDs.computeProgress(snapshot, student);

    expect(result).toEqual({ completed: 0, total: 2, percent: 0 });
  });

  test('1/2 — один шаг завершён', () => {
    const student = studentWithSteps({
      completed: ['77777777-7777-4777-8777-777777777777'],
      issued: ['88888888-8888-4888-8888-888888888888'],
      currentStepId: '88888888-8888-4888-8888-888888888888',
    });

    const result = StreamDs.computeProgress(snapshot, student);

    expect(result).toEqual({ completed: 1, total: 2, percent: 50 });
  });

  test('2/2 — все шаги завершены', () => {
    const student = studentWithSteps({
      completed: [
        '77777777-7777-4777-8777-777777777777',
        '88888888-8888-4888-8888-888888888888',
      ],
      currentStepId: '88888888-8888-4888-8888-888888888888',
    });

    const result = StreamDs.computeProgress(snapshot, student);

    expect(result).toEqual({ completed: 2, total: 2, percent: 100 });
  });

  test('многопроектный: 3/4', () => {
    const student = studentWithSteps({
      completed: [
        '77777777-7777-4777-8777-777777777777',
        '88888888-8888-4888-8888-888888888888',
        'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      ],
      issued: ['dddddddd-dddd-4ddd-8ddd-dddddddddddd'],
      currentStepId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    });

    const result = StreamDs.computeProgress(multiSnapshot, student);

    expect(result).toEqual({ completed: 3, total: 4, percent: 75 });
  });
});

describe('StreamDs.buildNavigationTree', () => {
  test('без активности — проекты видны, все locked', () => {
    const student = studentWithSteps();

    const result = StreamDs.buildNavigationTree(snapshot, student);

    expect(result.projects).toHaveLength(1);
    expect(result.projects[0]!.status).toBe('locked');
    expect(result.projects[0]!.lessons[0]!.status).toBe('locked');
    expect(result.projects[0]!.lessons[0]!.steps).toHaveLength(2);
    expect(result.projects[0]!.lessons[0]!.steps[0]!.status).toBe('locked');
  });

  test('один проект с 1/2 шагами, статус current', () => {
    const student = studentWithSteps({
      completed: ['77777777-7777-4777-8777-777777777777'],
      issued: ['88888888-8888-4888-8888-888888888888'],
      currentStepId: '88888888-8888-4888-8888-888888888888',
    });

    const result = StreamDs.buildNavigationTree(snapshot, student);

    expect(result.projects).toHaveLength(1);
    const p = result.projects[0]!;
    expect(p.title).toBe('П1');
    expect(p.status).toBe('current');
    expect(p.completedLessons).toBe(1);
    expect(p.totalLessons).toBe(1);
    expect(p.lessons).toHaveLength(1);
    const l = p.lessons[0]!;
    expect(l.title).toBe('У1');
    expect(l.status).toBe('current');
    expect(l.completedSteps).toBe(1);
    expect(l.totalSteps).toBe(2);
    expect(l.steps).toHaveLength(2);
    expect(l.steps[0]!.status).toBe('completed');
    expect(l.steps[1]!.status).toBe('current');
  });

  test('полное завершение — статус completed', () => {
    const student = studentWithSteps({
      completed: [
        '77777777-7777-4777-8777-777777777777',
        '88888888-8888-4888-8888-888888888888',
      ],
      currentStepId: '88888888-8888-4888-8888-888888888888',
    });

    const result = StreamDs.buildNavigationTree(snapshot, student);

    expect(result.projects[0]!.status).toBe('completed');
    expect(result.projects[0]!.lessons[0]!.status).toBe('completed');
  });

  test('многопроектный: П1 current, П2 locked', () => {
    const student = studentWithSteps({
      issued: ['77777777-7777-4777-8777-777777777777'],
      currentStepId: '77777777-7777-4777-8777-777777777777',
    });

    const result = StreamDs.buildNavigationTree(multiSnapshot, student);

    // Оба проекта видны
    expect(result.projects).toHaveLength(2);
    expect(result.projects[0]!.title).toBe('П1');
    expect(result.projects[0]!.status).toBe('current');
    expect(result.projects[1]!.title).toBe('П2');
    expect(result.projects[1]!.status).toBe('locked');
  });

  test('многопроектный: оба с прогрессом', () => {
    const student = studentWithSteps({
      completed: [
        '77777777-7777-4777-8777-777777777777',
        '88888888-8888-4888-8888-888888888888',
        'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      ],
      issued: ['dddddddd-dddd-4ddd-8ddd-dddddddddddd'],
      currentStepId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    });

    const result = StreamDs.buildNavigationTree(multiSnapshot, student);

    expect(result.projects).toHaveLength(2);
    expect(result.projects[0]!.status).toBe('completed');
    expect(result.projects[0]!.completedLessons).toBe(2);
    expect(result.projects[0]!.lessons).toHaveLength(2);
    expect(result.projects[1]!.title).toBe('П2');
    expect(result.projects[1]!.status).toBe('current');
    expect(result.projects[1]!.completedLessons).toBe(0);
    expect(result.projects[1]!.lessons).toHaveLength(1);
  });
});

describe('StreamDs.buildLessonSteps', () => {
  test('шаги урока: completed + current', () => {
    const student = studentWithSteps({
      completed: ['77777777-7777-4777-8777-777777777777'],
      issued: ['88888888-8888-4888-8888-888888888888'],
      currentStepId: '88888888-8888-4888-8888-888888888888',
    });

    const result = StreamDs.buildLessonSteps(
      snapshot,
      '66666666-6666-4666-8666-666666666666',
      student,
    );

    expect(result).not.toBeNull();
    expect(result!.lessonTitle).toBe('У1');
    expect(result!.projectTitle).toBe('П1');
    expect(result!.steps).toHaveLength(2);
    expect(result!.steps[0]!.status).toBe('completed');
    expect(result!.steps[1]!.status).toBe('current');
  });

  test('шаги урока: completed + locked', () => {
    const student = studentWithSteps({
      completed: ['77777777-7777-4777-8777-777777777777'],
      currentStepId: '77777777-7777-4777-8777-777777777777',
    });

    const result = StreamDs.buildLessonSteps(
      snapshot,
      '66666666-6666-4666-8666-666666666666',
      student,
    );

    expect(result!.steps[0]!.status).toBe('completed');
    expect(result!.steps[1]!.status).toBe('locked');
  });

  test('несуществующий урок → null', () => {
    const student = studentWithSteps();

    const result = StreamDs.buildLessonSteps(
      snapshot,
      '00000000-0000-4000-8000-000000000000',
      student,
    );

    expect(result).toBeNull();
  });

  test('индексы 1-based', () => {
    const student = studentWithSteps({
      issued: ['dddddddd-dddd-4ddd-8ddd-dddddddddddd'],
      currentStepId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    });

    const result = StreamDs.buildLessonSteps(
      multiSnapshot,
      'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      student,
    );

    expect(result!.projectIndex).toBe(2);
    expect(result!.lessonIndex).toBe(1);
  });
});

describe('StreamDs.computeProjectLevelProgress', () => {
  test('0/2 — нет завершённых уроков', () => {
    const student = studentWithSteps({
      completed: ['77777777-7777-4777-8777-777777777777'],
      issued: ['88888888-8888-4888-8888-888888888888'],
      currentStepId: '88888888-8888-4888-8888-888888888888',
    });

    const result = StreamDs.computeProjectLevelProgress(snapshot, 0, student);

    expect(result).toEqual({ completed: 0, total: 1, percent: 0 });
  });

  test('1/1 — урок полностью завершён', () => {
    const student = studentWithSteps({
      completed: [
        '77777777-7777-4777-8777-777777777777',
        '88888888-8888-4888-8888-888888888888',
      ],
      currentStepId: '88888888-8888-4888-8888-888888888888',
    });

    const result = StreamDs.computeProjectLevelProgress(snapshot, 0, student);

    expect(result).toEqual({ completed: 1, total: 1, percent: 100 });
  });

  test('многопроектный: 2/2', () => {
    const student = studentWithSteps({
      completed: [
        '77777777-7777-4777-8777-777777777777',
        '88888888-8888-4888-8888-888888888888',
        'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      ],
      issued: ['dddddddd-dddd-4ddd-8ddd-dddddddddddd'],
      currentStepId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    });

    // П1: У1.1 завершён (2 шага: 7777,8888), У1.2 завершён (1 шаг: aaaa)
    const result = StreamDs.computeProjectLevelProgress(
      multiSnapshot,
      0,
      student,
    );

    expect(result).toEqual({ completed: 2, total: 2, percent: 100 });
  });
});

describe('StreamDs.computeStreamProjectProgress', () => {
  test('0/1 — нет завершённых проектов', () => {
    const student = studentWithSteps({
      completed: ['77777777-7777-4777-8777-777777777777'],
      issued: ['88888888-8888-4888-8888-888888888888'],
      currentStepId: '88888888-8888-4888-8888-888888888888',
    });

    const result = StreamDs.computeStreamProjectProgress(snapshot, student);

    expect(result).toEqual({ completed: 0, total: 1, percent: 0 });
  });

  test('1/1 — проект полностью завершён', () => {
    const student = studentWithSteps({
      completed: [
        '77777777-7777-4777-8777-777777777777',
        '88888888-8888-4888-8888-888888888888',
      ],
      currentStepId: '88888888-8888-4888-8888-888888888888',
    });

    const result = StreamDs.computeStreamProjectProgress(snapshot, student);

    expect(result).toEqual({ completed: 1, total: 1, percent: 100 });
  });

  test('многопроектный: 1/2', () => {
    const student = studentWithSteps({
      completed: [
        '77777777-7777-4777-8777-777777777777',
        '88888888-8888-4888-8888-888888888888',
        'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      ],
      issued: ['dddddddd-dddd-4ddd-8ddd-dddddddddddd'],
      currentStepId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    });

    // П1: оба урока завершены, П2: ни один не завершён
    const result = StreamDs.computeStreamProjectProgress(
      multiSnapshot,
      student,
    );

    expect(result).toEqual({ completed: 1, total: 2, percent: 50 });
  });
});

// ── categorizeStudents ──

describe('StreamDs.categorizeStudents', () => {
  const now = new Date('2026-08-01T12:00');

  function st(
    overrides: Partial<{
      uuid: string;
      status: string;
      steps: Array<{
        stepId: string;
        status: string;
        issuedAt: string;
        completedAt?: string;
      }>;
    }> = {},
  ): any {
    return {
      uuid: overrides.uuid ?? '00000000-0000-4000-8000-000000000001',
      streamId: '11111111-1111-4111-8111-111111111111',
      userId: '22222222-2222-4222-8222-222222222222',
      enrolledAt: '2026-07-01T00:00',
      status: overrides.status ?? 'active',
      currentStepId: '33333333-3333-4333-8333-333333333333',
      steps: overrides.steps ?? [],
      createdAt: '2026-07-01T00:00',
    };
  }

  test('все on_track при пустом списке студентов', () => {
    const result = StreamDs.categorizeStudents([], now);
    expect(result).toEqual([]);
  });

  test('студент без шагов — on_track', () => {
    const result = StreamDs.categorizeStudents([st()], now);
    expect(result[0]!.lagLevel).toBe('on_track');
    expect(result[0]!.studentId).toBe('00000000-0000-4000-8000-000000000001');
  });

  test('>7 дней — critical', () => {
    const result = StreamDs.categorizeStudents(
      [
        st({
          steps: [
            {
              stepId: '33333333-3333-4333-8333-333333333333',
              status: 'completed',
              issuedAt: '2026-07-20T12:00',
              completedAt: '2026-07-24T12:00',
            },
          ],
        }),
      ],
      now,
    );
    expect(result[0]!.lagLevel).toBe('critical');
  });

  test('>4 дней — lagging', () => {
    const result = StreamDs.categorizeStudents(
      [
        st({
          steps: [
            {
              stepId: '33333333-3333-4333-8333-333333333333',
              status: 'completed',
              issuedAt: '2026-07-26T12:00',
              completedAt: '2026-07-27T12:00',
            },
          ],
        }),
      ],
      now,
    );
    expect(result[0]!.lagLevel).toBe('lagging');
  });

  test('неактивные статусы — on_track', () => {
    const result = StreamDs.categorizeStudents(
      [
        st({ status: 'abandoned', steps: [] }),
        st({ status: 'advanced', steps: [] }),
        st({ status: 'not_advanced', steps: [] }),
      ],
      now,
    );
    expect(result[0]!.lagLevel).toBe('on_track');
    expect(result[1]!.lagLevel).toBe('on_track');
    expect(result[2]!.lagLevel).toBe('on_track');
  });

  test('медиана: on_track по времени, но отстаёт от группы на 30%+ → lagging', () => {
    // Один студент выполнил шаг 1 час назад, второй — 50 часов назад
    // Медиана ~25.5 часов. Второй: 50 >= 25.5*1.3=33.15 → true → lagging
    const result = StreamDs.categorizeStudents(
      [
        st({
          uuid: '00000000-0000-4000-8000-000000000001',
          steps: [
            {
              stepId: '33333333-3333-4333-8333-333333333333',
              status: 'completed',
              issuedAt: '2026-08-01T10:00',
              completedAt: '2026-08-01T11:00',
            },
          ],
        }),
        st({
          uuid: '00000000-0000-4000-8000-000000000002',
          steps: [
            {
              stepId: '33333333-3333-4333-8333-333333333333',
              status: 'completed',
              issuedAt: '2026-07-29T10:00',
              completedAt: '2026-07-30T10:00',
            },
          ],
        }),
      ],
      now,
    );
    expect(result[0]!.lagLevel).toBe('on_track');
    expect(result[1]!.lagLevel).toBe('lagging');
  });
});

describe('computeStepTimeStats', () => {
  test('пустой массив → все нули', () => {
    const stats = StreamDs.computeStepTimeStats([]);
    expect(stats).toEqual({ runner: 0, fast: 0, normal: 0, deep: 0 });
  });

  test('пропускает шаги без completedAt', () => {
    const steps = [
      { stepId: 's1', status: 'issued' as const, issuedAt: '2026-08-01T10:00' },
    ];
    const stats = StreamDs.computeStepTimeStats(steps);
    expect(stats).toEqual({ runner: 0, fast: 0, normal: 0, deep: 0 });
  });

  test('30 секунд → runner', () => {
    const steps = [
      {
        stepId: 's1',
        status: 'completed' as const,
        issuedAt: '2026-08-01T10:00',
        completedAt: '2026-08-01T10:00',
      },
    ];
    const stats = StreamDs.computeStepTimeStats(steps);
    expect(stats.runner).toBe(1);
  });

  test('3 минуты → fast', () => {
    const steps = [
      {
        stepId: 's1',
        status: 'completed' as const,
        issuedAt: '2026-08-01T10:00',
        completedAt: '2026-08-01T10:03',
      },
    ];
    const stats = StreamDs.computeStepTimeStats(steps);
    expect(stats.fast).toBe(1);
  });

  test('10 минут → normal', () => {
    const steps = [
      {
        stepId: 's1',
        status: 'completed' as const,
        issuedAt: '2026-08-01T10:00',
        completedAt: '2026-08-01T10:10',
      },
    ];
    const stats = StreamDs.computeStepTimeStats(steps);
    expect(stats.normal).toBe(1);
  });

  test('20 минут → deep', () => {
    const steps = [
      {
        stepId: 's1',
        status: 'completed' as const,
        issuedAt: '2026-08-01T10:00',
        completedAt: '2026-08-01T10:20',
      },
    ];
    const stats = StreamDs.computeStepTimeStats(steps);
    expect(stats.deep).toBe(1);
  });

  test('смешанные шаги — корректные категории', () => {
    const steps = [
      {
        stepId: 'r1',
        status: 'completed' as const,
        issuedAt: '2026-08-01T10:00',
        completedAt: '2026-08-01T10:00',
      },
      {
        stepId: 'f1',
        status: 'completed' as const,
        issuedAt: '2026-08-01T10:00',
        completedAt: '2026-08-01T10:02',
      },
      {
        stepId: 'n1',
        status: 'completed' as const,
        issuedAt: '2026-08-01T10:00',
        completedAt: '2026-08-01T10:10',
      },
      {
        stepId: 'd1',
        status: 'completed' as const,
        issuedAt: '2026-08-01T10:00',
        completedAt: '2026-08-01T10:20',
      },
    ];
    const stats = StreamDs.computeStepTimeStats(steps);
    expect(stats).toEqual({ runner: 1, fast: 1, normal: 1, deep: 1 });
  });
});

// ═══════════════════════════════════════════
// computeAvgTime
// ═══════════════════════════════════════════

describe('computeAvgTime', () => {
  test('пустой массив → null', () => {
    const result = StreamDs.computeAvgTime([]);
    expect(result.avgMinutes).toBeNull();
    expect(result.dominant).toBeNull();
  });

  test('один шаг за 2 минуты → avg=2, доминанта Спринтер', () => {
    const steps = [
      {
        stepId: 's1',
        status: 'completed' as const,
        issuedAt: '2026-08-01T10:00',
        completedAt: '2026-08-01T10:02',
      },
    ];
    const result = StreamDs.computeAvgTime(steps);
    expect(result.avgMinutes).toBe(2);
    expect(result.dominant?.emoji).toBe('⚡');
    expect(result.dominant?.name).toBe('Спринтер');
  });

  test('смешанные шаги — правильное среднее', () => {
    const steps = [
      {
        stepId: 's1',
        status: 'completed' as const,
        issuedAt: '2026-08-01T10:00',
        completedAt: '2026-08-01T10:01',
      }, // 1 мин
      {
        stepId: 's2',
        status: 'completed' as const,
        issuedAt: '2026-08-01T10:00',
        completedAt: '2026-08-01T10:05',
      }, // 5 мин
    ];
    const result = StreamDs.computeAvgTime(steps);
    expect(result.avgMinutes).toBe(3);
  });

  test('пропускает шаги без completedAt', () => {
    const steps = [
      {
        stepId: 's1',
        status: 'completed' as const,
        issuedAt: '2026-08-01T10:00',
        completedAt: '2026-08-01T10:02',
      },
      { stepId: 's2', status: 'issued' as const, issuedAt: '2026-08-01T10:00' },
    ];
    const result = StreamDs.computeAvgTime(steps);
    expect(result.avgMinutes).toBe(2);
  });
});

// ═══════════════════════════════════════════
// computeStudentRowSummary
// ═══════════════════════════════════════════

describe('computeStudentRowSummary', () => {
  const snapshot = [
    {
      projectTitle: 'Проект 1',
      projectId: 'p1',
      lessons: [
        {
          lessonTitle: 'Урок 1',
          lessonId: 'l1',
          stepIds: ['s1', 's2', 's3'],
        },
      ],
    },
  ];

  test('студент без шагов — 0%, нет времени', () => {
    const student = {
      uuid: 'st1',
      userId: 'u1',
      streamId: 'str1',
      status: 'active' as const,
      enrolledAt: '2026-06-01T00:00',
      createdAt: '2026-06-01T00:00',
      currentStepId: 's1',
      steps: [],
    };
    const summary = StreamDs.computeStudentRowSummary(snapshot, student as any);
    expect(summary.progress.percent).toBe(0);
    expect(summary.progress.total).toBe(3);
    expect(summary.progress.completed).toBe(0);
    expect(summary.avgTimeMinutes).toBeNull();
    expect(summary.dominantCategory).toBeNull();
  });

  test('студент с 2/3 шагов — 67%, есть время', () => {
    const student = {
      uuid: 'st1',
      userId: 'u1',
      streamId: 'str1',
      status: 'active' as const,
      enrolledAt: '2026-06-01T00:00',
      currentStepId: 's3',
      steps: [
        {
          stepId: 's1',
          status: 'completed' as const,
          issuedAt: '2026-08-01T10:00',
          completedAt: '2026-08-01T10:02',
        },
        {
          stepId: 's2',
          status: 'completed' as const,
          issuedAt: '2026-08-01T10:05',
          completedAt: '2026-08-01T10:08',
        },
        {
          stepId: 's3',
          status: 'issued' as const,
          issuedAt: '2026-08-01T10:10',
        },
      ],
    };
    const summary = StreamDs.computeStudentRowSummary(snapshot, student as any);
    expect(summary.progress.percent).toBe(67);
    expect(summary.progress.completed).toBe(2);
    expect(summary.progress.total).toBe(3);
    expect(summary.avgTimeMinutes).toBe(3);
    expect(summary.dominantCategory).not.toBeNull();
  });
});

// ═══════════════════════════════════════════
// computeStudentCard
// ═══════════════════════════════════════════

describe('computeStudentCard', () => {
  const snapshot = [
    {
      projectTitle: 'Проект 1',
      projectId: 'p1',
      lessons: [
        {
          lessonTitle: 'Урок 1',
          lessonId: 'l1',
          stepIds: ['s1', 's2'],
        },
        {
          lessonTitle: 'Урок 2',
          lessonId: 'l2',
          stepIds: ['s3', 's4'],
        },
      ],
    },
  ];

  test('полная карточка с прогрессом модуля и проекта', () => {
    const student = {
      uuid: 'st1',
      userId: 'u1',
      streamId: 'str1',
      status: 'active' as const,
      enrolledAt: '2026-06-01T00:00',
      createdAt: '2026-06-01T00:00',
      currentStepId: 's2',
      steps: [
        {
          stepId: 's1',
          status: 'completed' as const,
          issuedAt: '2026-08-01T10:00',
          completedAt: '2026-08-01T10:03',
        },
        {
          stepId: 's2',
          status: 'issued' as const,
          issuedAt: '2026-08-01T10:05',
        },
      ],
    };

    const card = StreamDs.computeStudentCard(snapshot, student as any, {
      lagLevel: 'on_track',
      hoursSinceLastActivity: 2,
    });

    // Модуль: 1/4
    expect(card.moduleProgress.completed).toBe(1);
    expect(card.moduleProgress.total).toBe(4);
    expect(card.moduleProgress.percent).toBe(25);

    // Проект: 0/2 уроков
    expect(card.currentProject?.title).toBe('Проект 1');
    expect(card.currentProject?.progress.completed).toBe(0);
    expect(card.currentProject?.progress.total).toBe(2);

    // Урок
    expect(card.currentLesson?.title).toBe('Урок 1');

    // Время
    expect(card.avgTimeMinutes).toBe(3);
    expect(card.timeCategories).toHaveLength(4);

    // Lag
    expect(card.lagLevel).toBe('on_track');
    expect(card.hoursSinceLastActivity).toBe(2);
  });

  test('студент без currentStepId — нет проекта/урока', () => {
    const student = {
      uuid: 'st1',
      userId: 'u1',
      streamId: 'str1',
      status: 'advanced' as const,
      enrolledAt: '2026-06-01T00:00',
      createdAt: '2026-06-01T00:00',
      currentStepId: '',
      steps: [],
    };

    const card = StreamDs.computeStudentCard(snapshot, student as any);
    expect(card.currentProject).toBeUndefined();
    expect(card.currentLesson).toBeUndefined();
    expect(card.avgTimeMinutes).toBeNull();
  });
});
