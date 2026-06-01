import { describe, expect, mock, test } from 'bun:test';
import { Role } from '@u7-scl/user/domain';
import { EnrollStudentUc } from './enroll-student-uc';

const mockDate = '2026-06-01T10:00';

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
          startDate: mockDate,
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
          createdAt: mockDate,
        }),
      ),
      save: mock(() => Promise.resolve()),
      getAll: mock(() => Promise.resolve([])),
    };
    const mockStudentRepo = {
      save: mock(() => Promise.resolve()),
      getByUuid: mock(() => Promise.resolve(undefined)),
      getByStream: mock(() => Promise.resolve([])),
      getByUser: mock(() => Promise.resolve([])),
    };
    const mockUserFacade = {
      getUserByUuid: mock(() =>
        Promise.resolve({
          uuid: '99999999-9999-4999-8999-999999999999',
          name: 'Guest',
          telegramId: 2,
          roles: [Role.GUEST],
          createdAt: mockDate,
        }),
      ),
      updateUserRole: mock(() => Promise.resolve({})),
      userExists: mock(() => Promise.resolve(true)),
      addRoleToUser: mock(() => Promise.resolve(undefined)),
      getUserByTelegramId: mock(() => Promise.resolve(undefined)),
      removeRoleFromUser: mock(() => Promise.resolve(undefined)),
      registerGuest: mock(() => Promise.resolve({} as any)),
    };

    const uc = new EnrollStudentUc();
    uc.init({
      streamRepo: mockStreamRepo as any,
      streamStudentRepo: mockStudentRepo as any,
      userFacade: mockUserFacade as any,
      courseFacade: {} as any,
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
          createdAt: mockDate,
        }),
      ),
      userExists: mock(() => Promise.resolve(true)),
      addRoleToUser: mock(() => Promise.resolve(undefined)),
      updateUserRole: mock(() => Promise.resolve(undefined)),
      getUserByTelegramId: mock(() => Promise.resolve(undefined)),
      removeRoleFromUser: mock(() => Promise.resolve(undefined)),
      registerGuest: mock(() => Promise.resolve({} as any)),
    };

    const uc = new EnrollStudentUc();
    uc.init({
      userFacade: mockUserFacade as any,
      streamRepo: {} as any,
      streamStudentRepo: {} as any,
      courseFacade: {} as any,
    });

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
