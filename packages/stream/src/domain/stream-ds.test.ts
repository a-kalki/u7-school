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
  test('пустое дерево — нет активности', () => {
    const student = studentWithSteps();

    const result = StreamDs.buildNavigationTree(snapshot, student);

    expect(result.projects).toHaveLength(0);
  });

  test('один проект с 1/2 уроками', () => {
    const student = studentWithSteps({
      completed: ['77777777-7777-4777-8777-777777777777'],
      issued: ['88888888-8888-4888-8888-888888888888'],
      currentStepId: '88888888-8888-4888-8888-888888888888',
    });

    const result = StreamDs.buildNavigationTree(snapshot, student);

    expect(result.projects).toHaveLength(1);
    expect(result.projects[0]!.title).toBe('П1');
    expect(result.projects[0]!.completedLessons).toBe(1);
    expect(result.projects[0]!.totalLessons).toBe(1);
    expect(result.projects[0]!.lessons).toHaveLength(1);
    expect(result.projects[0]!.lessons[0]!.title).toBe('У1');
    expect(result.projects[0]!.lessons[0]!.completedSteps).toBe(1);
    expect(result.projects[0]!.lessons[0]!.totalSteps).toBe(2);
  });

  test('полное завершение — всё посчитано', () => {
    const student = studentWithSteps({
      completed: [
        '77777777-7777-4777-8777-777777777777',
        '88888888-8888-4888-8888-888888888888',
      ],
      currentStepId: '88888888-8888-4888-8888-888888888888',
    });

    const result = StreamDs.buildNavigationTree(snapshot, student);

    expect(result.projects[0]!.completedLessons).toBe(1);
  });

  test('многопроектный: П1 активен, П2 скрыт', () => {
    const student = studentWithSteps({
      issued: ['77777777-7777-4777-8777-777777777777'],
      currentStepId: '77777777-7777-4777-8777-777777777777',
    });

    const result = StreamDs.buildNavigationTree(multiSnapshot, student);

    expect(result.projects).toHaveLength(1);
    expect(result.projects[0]!.title).toBe('П1');
  });

  test('многопроектный: оба проекта видны', () => {
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
    expect(result.projects[0]!.completedLessons).toBe(2);
    expect(result.projects[0]!.lessons).toHaveLength(2);
    expect(result.projects[1]!.title).toBe('П2');
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
