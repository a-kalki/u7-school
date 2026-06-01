import { describe, expect, mock, test } from 'bun:test';
import { Role } from '@u7-scl/user/domain';
import { EnrollStudentUc } from './enroll-student-uc';

describe('EnrollStudentUc', () => {
  test('успешно зачисляет GUEST', async () => {
    const mockStreamRepo = {
      getByUuid: mock(() =>
        Promise.resolve({
          uuid: '11111111-1111-4111-8111-111111111111',
          title: 'Test Stream',
          description: 'Description',
          mentorId: '22222222-2222-4222-8222-222222222222',
          moduleId: '33333333-3333-4333-8333-333333333333',
          startDate: '2026-06-01T10:00',
          status: 'enrollment',
          contentSnapshot: [
            {
              projectId: '44444444-4444-4444-8444-444444444444',
              projectTitle: 'Project 1',
              lessons: [
                {
                  lessonId: '55555555-5555-4555-8555-555555555555',
                  lessonTitle: 'Lesson 1',
                  stepIds: ['66666666-6666-4666-8666-666666666666'],
                },
              ],
            },
          ],
          createdAt: '2026-06-01T10:00',
        }),
      ),
    };
    const mockStudentRepo = { save: mock(() => Promise.resolve()) };
    const mockUserFacade = {
      getUserByUuid: mock(() =>
        Promise.resolve({
          uuid: '99999999-9999-4999-8999-999999999999',
          name: 'Guest',
          telegramId: 2,
          roles: [Role.GUEST],
          createdAt: '2026-06-01T10:00',
        }),
      ),
      updateUserRole: mock(() => Promise.resolve({})),
    };

    const uc = new EnrollStudentUc();
    // @ts-expect-error
    uc.init({
      streamRepo: mockStreamRepo,
      streamStudentRepo: mockStudentRepo,
      userFacade: mockUserFacade,
    });

    await uc.execute(
      {
        streamId: '11111111-1111-4111-8111-111111111111',
        userId: '99999999-9999-4999-8999-999999999999',
      },
      '99999999-9999-4999-8999-999999999999',
    );
    expect(mockStudentRepo.save).toHaveBeenCalled();
    expect(mockUserFacade.updateUserRole).toHaveBeenCalledWith(
      '99999999-9999-4999-8999-999999999999',
      Role.STUDENT,
      '99999999-9999-4999-8999-999999999999',
    );
  });

  test('бросает ошибку для STUDENT', async () => {
    const mockUserFacade = {
      getUserByUuid: mock(() =>
        Promise.resolve({
          uuid: '99999999-9999-4999-8999-999999999999',
          name: 'Student',
          telegramId: 3,
          roles: [Role.STUDENT],
          createdAt: '2026-06-01T10:00',
        }),
      ),
    };

    const uc = new EnrollStudentUc();
    // @ts-expect-error
    uc.init({ userFacade: mockUserFacade });

    await expect(
      uc.execute(
        {
          streamId: '11111111-1111-4111-8111-111111111111',
          userId: '99999999-9999-4999-8999-999999999999',
        },
        '99999999-9999-4999-8999-999999999999',
      ),
    ).rejects.toThrow();
  });
});
