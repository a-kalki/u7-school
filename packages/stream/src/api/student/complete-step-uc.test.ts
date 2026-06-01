import { describe, expect, mock, test } from 'bun:test';
import { CompleteStepUc } from './complete-step-uc';

describe('CompleteStepUc', () => {
  test('успешно завершает шаг', async () => {
    const mockStreamRepo = {
      getByUuid: mock(() =>
        Promise.resolve({
          uuid: '11111111-1111-4111-8111-111111111111',
          title: 'Test',
          description: 'Desc',
          mentorId: '22222222-2222-4222-8222-222222222222',
          moduleId: '33333333-3333-4333-8333-333333333333',
          startDate: '2026-06-01T10:00',
          status: 'active',
          contentSnapshot: [
            {
              projectId: '44444444-4444-4444-8444-444444444444',
              projectTitle: 'Proj',
              lessons: [
                {
                  lessonId: '55555555-5555-4555-8555-555555555555',
                  lessonTitle: 'Les',
                  stepIds: [
                    '66666666-6666-4666-8666-666666666666',
                    '77777777-7777-4777-8777-777777777777',
                  ],
                },
              ],
            },
          ],
          createdAt: '2026-06-01T10:00',
        }),
      ),
    };
    const mockStudentRepo = {
      getByUuid: mock(() =>
        Promise.resolve({
          uuid: '88888888-8888-4888-8888-888888888888',
          streamId: '11111111-1111-4111-8111-111111111111',
          userId: '99999999-9999-4999-8999-999999999999',
          status: 'active',
          currentStepId: '66666666-6666-4666-8666-666666666666',
          steps: [
            {
              stepId: '66666666-6666-4666-8666-666666666666',
              status: 'issued',
              issuedAt: '2026-06-01T10:00',
            },
          ],
          enrolledAt: '2026-06-01T10:00',
          createdAt: '2026-06-01T10:00',
        }),
      ),
      save: mock(() => Promise.resolve()),
    };

    const uc = new CompleteStepUc();
    // @ts-expect-error
    uc.init({
      streamRepo: mockStreamRepo,
      streamStudentRepo: mockStudentRepo,
    });

    const result = await uc.execute(
      {
        studentId: '88888888-8888-4888-8888-888888888888',
        streamId: '11111111-1111-4111-8111-111111111111',
        stepId: '66666666-6666-4666-8666-666666666666',
      },
      '99999999-9999-4999-8999-999999999999',
    );

    expect(result.level).toBe('step');
    expect(result.currentStepId).toBe('77777777-7777-4777-8777-777777777777');
    expect(mockStudentRepo.save).toHaveBeenCalled();
  });
});
