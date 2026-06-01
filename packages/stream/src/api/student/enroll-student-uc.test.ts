import { describe, expect, mock, test } from 'bun:test';
import { isoNow } from '@u7-scl/core/shared';
import { Role } from '@u7-scl/user/domain';
import { EnrollStudentUc } from './enroll-student-uc';

describe('EnrollStudentUc', () => {
  test('успешно зачисляет GUEST', async () => {
    const mockStreamRepo = {
      getByUuid: mock(() =>
        Promise.resolve({ uuid: 's1', status: 'enrollment' }),
      ),
    };
    const mockStudentRepo = { save: mock(() => Promise.resolve()) };
    const mockUserFacade = {
      getUserByUuid: mock(() =>
        Promise.resolve({
          uuid: 'u1',
          name: 'Guest',
          telegramId: 2,
          roles: [Role.GUEST],
          createdAt: isoNow(),
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

    await uc.execute({ streamId: 's1', userId: 'u1' }, 'u1');
    expect(mockStudentRepo.save).toHaveBeenCalled();
    expect(mockUserFacade.updateUserRole).toHaveBeenCalledWith(
      'u1',
      Role.STUDENT,
      'u1',
    );
  });

  test('бросает ошибку для STUDENT', async () => {
    const mockUserFacade = {
      getUserByUuid: mock(() =>
        Promise.resolve({
          uuid: 'u1',
          name: 'Student',
          telegramId: 3,
          roles: [Role.STUDENT],
          createdAt: isoNow(),
        }),
      ),
    };

    const uc = new EnrollStudentUc();
    // @ts-expect-error
    uc.init({ userFacade: mockUserFacade });

    await expect(
      uc.execute({ streamId: 's1', userId: 'u1' }, 'u1'),
    ).rejects.toThrow();
  });
});
