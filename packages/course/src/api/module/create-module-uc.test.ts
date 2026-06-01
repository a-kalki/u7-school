import { describe, expect, mock, test } from 'bun:test';
import type { User } from '@u7-scl/user/domain';
import { Role } from '@u7-scl/user/domain';
import type { Module } from '#domain/module/entity';
import type { ModuleRepo } from '#domain/module/repo';
import { CreateModuleUc } from './create-module-uc';

function makeUser(overrides: Partial<User> = {}): User {
  return {
    uuid: crypto.randomUUID(),
    name: 'Тест',
    telegramId: 1,
    roles: [Role.ADMIN],
    createdAt: '2026-05-01T12:00',
    ...overrides,
  };
}

function setupUc() {
  const save = mock(async (_module: Module): Promise<void> => {});
  const getByUuid = mock(
    async (_uuid: string): Promise<Module | undefined> => undefined,
  );
  const getAll = mock(async (): Promise<Module[]> => []);

  const repo: ModuleRepo = { save, getByUuid, getAll };
  const getUserByUuid = mock(
    async (_uuid: string): Promise<User | undefined> => undefined,
  );
  const userExists = mock(async (_uuid: string): Promise<boolean> => false);
  const userFacade = {
    getUserByUuid,
    userExists,
    addRoleToUser: mock(),
    getUserByTelegramId: mock(async () => undefined),
    removeRoleFromUser: mock(),
    updateUserRole: mock(),
    registerGuest: mock(async () => ({
      uuid: '',
      name: '',
      telegramId: 0,
      roles: [],
      createdAt: '',
    })),
  };

  const uc = new CreateModuleUc();
  uc.init({
    courseRepo: repo,
    lessonRepo: {} as never,
    stepRepo: {} as never,
    userFacade,
  });

  return {
    save,
    getByUuid,
    getAll,
    getUserByUuid,
    userExists,
    userFacade,
    repo,
    uc,
  };
}

describe('CreateModuleUc', () => {
  describe('SUCCESS', () => {
    test('MENTOR создаёт курс', async () => {
      const { getUserByUuid, save, uc } = setupUc();
      const mentor = makeUser({ roles: [Role.MENTOR] });
      getUserByUuid.mockResolvedValueOnce(mentor);

      const course = await uc.handle(
        { title: 'Курс Python', description: 'Описание' },
        mentor.uuid,
      );

      expect((course as Module).title).toBe('Курс Python');
      expect((course as Module).authorId).toBe(mentor.uuid);
      expect(save).toHaveBeenCalledTimes(1);
    });
  });

  describe('FAIL', () => {
    test('ADMIN не может создать курс с kind=modules', async () => {
      const { getUserByUuid, uc } = setupUc();
      const admin = makeUser();
      getUserByUuid.mockResolvedValueOnce(admin);

      const createCourseCb = async () =>
        uc.handle({ title: 'Курс JS', description: 'Описание' }, admin.uuid);

      await expect(createCourseCb()).rejects.toThrow(
        'Недостаточно прав для создания модуля',
      );
    });

    test('отклоняет невалидную команду', async () => {
      const { getUserByUuid, uc } = setupUc();
      const admin = makeUser();
      getUserByUuid.mockResolvedValueOnce(admin);

      await expect(
        uc.handle({ title: '', description: 'Описание' }, admin.uuid),
      ).rejects.toThrow('Переданы некорректные данные');
    });

    test('отклоняет несуществующего пользователя', async () => {
      const { getUserByUuid, uc } = setupUc();
      getUserByUuid.mockResolvedValueOnce(undefined);

      await expect(
        uc.handle({ title: 'Курс', description: 'Описание' }, 'nonexistent'),
      ).rejects.toThrow('Пользователь не найден');
    });

    test('отклоняет STUDENT без прав', async () => {
      const { getUserByUuid, uc } = setupUc();
      const student = makeUser({ roles: [Role.STUDENT] });
      getUserByUuid.mockResolvedValueOnce(student);

      await expect(
        uc.handle({ title: 'Курс', description: 'Описание' }, student.uuid),
      ).rejects.toThrow('Недостаточно прав для создания модуля');
    });
  });
});
