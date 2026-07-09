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
