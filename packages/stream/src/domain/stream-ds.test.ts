import { describe, expect, test } from 'bun:test';
import { StreamAr } from './stream/a-root';
import { StreamStudentAr } from './stream-student/a-root';
import { StreamDs } from './stream-ds';
import { StreamStatus } from './status';
import type { ContentSnapshot } from './stream/entity';

const mockStreamId = '11111111-1111-4111-8111-111111111111';
const mockUserId = '22222222-2222-4222-8222-222222222222';
const mockMentorId = '33333333-3333-4333-8333-333333333333';
const mockModuleId = '44444444-4444-4444-8444-444444444444';

const snapshot: ContentSnapshot = [
  {
    projectId: '55555555-5555-4555-8555-555555555555',
    projectTitle: 'П1',
    lessons: [{ lessonId: '66666666-6666-4666-8666-666666666666', lessonTitle: 'У1', stepIds: ['77777777-7777-4777-8777-777777777777', '88888888-8888-4888-8888-888888888888'] }],
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
    const student = StreamStudentAr.enroll(stream.state.uuid, mockUserId, '77777777-7777-4777-8777-777777777777');
    student.issueStep('77777777-7777-4777-8777-777777777777');

    const result = StreamDs.completeStep(stream, student, '77777777-7777-4777-8777-777777777777');

    expect(result).toEqual({ level: 'step', currentStepId: '88888888-8888-4888-8888-888888888888' });
    expect(student.state.steps.find(s => s.stepId === '77777777-7777-4777-8777-777777777777')?.status).toBe('completed');
    expect(student.state.steps.find(s => s.stepId === '88888888-8888-4888-8888-888888888888')?.status).toBe('issued');
  });

  test('при завершении последнего шага потока — студент completed', () => {
    const stream = StreamAr.create(mockCreateCmd, snapshot);
    stream.activate();
    const student = StreamStudentAr.enroll(stream.state.uuid, mockUserId, '88888888-8888-4888-8888-888888888888');
    student.issueStep('88888888-8888-4888-8888-888888888888');

    const result = StreamDs.completeStep(stream, student, '88888888-8888-4888-8888-888888888888');

    expect(result).toEqual({ level: 'stream', completed: true });
    expect(student.state.status).toBe('completed');
  });
});
