import { describe, expect, mock, test } from 'bun:test';
import type { User } from '@u7-scl/user/domain';
import { Role } from '@u7-scl/user/domain';
import type { Lesson, LessonRepo } from '#domain/index';
import type { CourseApiModuleResolver } from '#domain/module';
import type { Module } from '#domain/module/entity';
import type { ModuleRepo } from '#domain/module/repo';
import { Status } from '#domain/status';
import type { Step } from '#domain/step/entity';
import type { StepRepo } from '#domain/step/repo';
import { CreateStepUc } from './create-step-uc';

function makeUser(r: Role[] = [Role.ADMIN]): User {
  return {
    uuid: crypto.randomUUID(),
    name: 'Т',
    telegramId: 1,
    roles: r,
    createdAt: '2026-05-01T12:00',
  };
}

function makeModule(authorId: string): Module {
  return {
    uuid: crypto.randomUUID(),
    title: 'К',
    description: 'О',
    authorId,
    status: Status.DRAFT,
    createdAt: '2026-05-01T12:00',
    projects: [],
  } as Module;
}

function setupUc() {
  const courseGetByUuid = mock(
    async (_uuid: string): Promise<Module | undefined> => undefined,
  );
  const courseRepo: ModuleRepo = {
    save: mock(async () => {}),
    getByUuid: courseGetByUuid,
    getAll: mock(async () => []),
  };
  const stepSave = mock(async (_s: Step): Promise<void> => {});
  const stepRepo: StepRepo = {
    save: stepSave,
    getByUuid: mock(async () => undefined),
    getByIds: mock(async () => []),
    getByCourseId: mock(async () => []),
  };
  const getUserByUuid = mock(
    async (_uuid: string): Promise<User | undefined> => undefined,
  );
  const lessonGetByUuid = mock(
    async () =>
      ({
        uuid: crypto.randomUUID(),
        moduleId: crypto.randomUUID(),
        kind: 'text' as const,
        title: 'Урок',
        status: Status.DRAFT,
        createdAt: '2026-05-01T12:00',
        stepIds: [],
        mentorStepIds: [],
      }) as Lesson,
  );
  const lessonSave = mock(async () => {});

  const userFacade = {
    getUserByUuid,
    userExists: mock(async () => false),
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
  const uc = new CreateStepUc();
  uc.init({
    courseRepo,
    lessonRepo: {
      getByUuid: lessonGetByUuid,
      save: lessonSave,
    } as unknown as LessonRepo,
    stepRepo,
    userFacade,
  } as unknown as CourseApiModuleResolver);
  return { courseGetByUuid, stepSave, getUserByUuid, uc };
}

describe('CreateStepUc', () => {
  describe('SUCCESS', () => {
    test('AUTHOR создаёт текстовый шаг в своём модуле', async () => {
      const { courseGetByUuid, stepSave, getUserByUuid, uc } = setupUc();
      const author = makeUser([Role.AUTHOR]);
      const module = makeModule(author.uuid);
      getUserByUuid.mockResolvedValueOnce(author);
      courseGetByUuid.mockResolvedValueOnce(module);

      const result = await uc.handle(
        {
          moduleId: module.uuid,
          kind: 'text' as const,
          lessonId: crypto.randomUUID(),
          description: 'Описание',
          content: 'Шаг 1',
        },
        author.uuid,
      );

      expect((result as Step).kind).toBe('text');
      expect(stepSave).toHaveBeenCalledTimes(1);
    });
  });

  describe('FAIL', () => {
    test('отклоняет STUDENT', async () => {
      const { getUserByUuid, uc } = setupUc();
      getUserByUuid.mockResolvedValueOnce(makeUser([Role.STUDENT]));

      await expect(
        uc.handle(
          {
            moduleId: crypto.randomUUID(),
            kind: 'text' as const,
            lessonId: crypto.randomUUID(),
            description: 'Описание',
            content: 'Ш',
          },
          'actor-id',
        ),
      ).rejects.toThrow('Недостаточно прав для создания шага');
    });

    test('отклоняет MENTOR без AUTHOR', async () => {
      const { getUserByUuid, uc } = setupUc();
      getUserByUuid.mockResolvedValueOnce(makeUser([Role.MENTOR]));

      await expect(
        uc.handle(
          {
            moduleId: crypto.randomUUID(),
            kind: 'text' as const,
            lessonId: crypto.randomUUID(),
            description: 'Описание',
            content: 'Ш',
          },
          'actor-id',
        ),
      ).rejects.toThrow('Недостаточно прав для создания шага');
    });

    test('отклоняет AUTHOR не автора модуля', async () => {
      const { courseGetByUuid, getUserByUuid, uc } = setupUc();
      const author = makeUser([Role.AUTHOR]);
      getUserByUuid.mockResolvedValueOnce(author);
      courseGetByUuid.mockResolvedValueOnce(makeModule(crypto.randomUUID()));

      await expect(
        uc.handle(
          {
            moduleId: crypto.randomUUID(),
            kind: 'text' as const,
            lessonId: crypto.randomUUID(),
            description: 'Описание',
            content: 'Ш',
          },
          author.uuid,
        ),
      ).rejects.toThrow('Вы не являетесь автором модуля');
    });
  });
});
