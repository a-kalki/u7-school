import { describe, expect, mock, test } from 'bun:test';
import type { User, UserFacade } from '@u7-scl/user/domain';
import { Role } from '@u7-scl/user/domain';
import type { Module } from '#domain/module/entity';
import type { ModuleRepo } from '#domain/module/repo';
import type { Lesson } from '#domain/lesson/entity';
import type { LessonRepo } from '#domain/lesson/repo';
import { Status } from '#domain/status';
import { CreateLessonUc } from './create-lesson-uc';

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
    title: "К",
    description: "О",
    authorId,
    targetAudience: undefined,
    goal: undefined,
    result: undefined,
    rules: undefined,
    additional: undefined,
    tags: [],
    status: Status.DRAFT,
    createdAt: "2026-05-01T12:00",
    projects: [],
  } as Module;
}

function setupUc() {
  const courseSave = mock(async () => {});
  const courseGetByUuid = mock(
    async (_uuid: string): Promise<Course | undefined> => undefined,
  );
  const courseRepo: ModuleRepo = {
    save: courseSave,
    getByUuid: courseGetByUuid,
    getAll: mock(async () => []),
  };
  const lessonSave = mock(async (_l: Lesson): Promise<void> => {});
  const lessonRepo: LessonRepo = {
    save: lessonSave,
    getByUuid: mock(async () => undefined),
    getByIds: mock(async () => []),
    getByCourseId: mock(async () => []),
  };
  const getUserByUuid = mock(
    async (_uuid: string): Promise<User | undefined> => undefined,
  );
  const userFacade: any = {
    getUserByUuid,
    userExists: mock(async () => false),
    addRoleToUser: mock(),
  };
  const uc = new CreateLessonUc();
  uc.init({
    courseRepo,
    lessonRepo,
    stepRepo: {} as never,
    userFacade,
  });
  return { courseGetByUuid, courseSave, lessonSave, getUserByUuid, uc };
}

describe('CreateLessonUc', () => {
  describe('SUCCESS', () => {
    test('MENTOR создаёт урок в своём курсе', async () => {
      const { courseGetByUuid, courseSave, lessonSave, getUserByUuid, uc } =
        setupUc();
      const mentor = makeUser([Role.MENTOR]);
      const course = makeModule(mentor.uuid, 'projects');
      getUserByUuid.mockResolvedValueOnce(mentor);
      courseGetByUuid.mockResolvedValueOnce(course);

      const projectId =
        (course as { projects?: { uuid: string }[] }).projects?.[0]?.uuid ?? '';

      const result = await uc.handle(
        {
          moduleId: course.uuid,
          projectId,
          title: 'Урок 1',
        },
        mentor.uuid,
      );

      expect((result as Lesson).title).toBe('Урок 1');
      expect(lessonSave).toHaveBeenCalledTimes(1);
      expect(courseSave).toHaveBeenCalledTimes(1);
    });
  });

  describe('FAIL', () => {
    test('отклоняет STUDENT без прав', async () => {
      const { getUserByUuid, uc } = setupUc();
      getUserByUuid.mockResolvedValueOnce(makeUser([Role.STUDENT]));

      await expect(
        uc.handle(
          {
            moduleId: crypto.randomUUID(),
            projectId: crypto.randomUUID(),
            title: 'У',
          },
          'actor-id',
        ),
      ).rejects.toThrow('Недостаточно прав для создания урока');
    });

    test('отклоняет MENTOR не автора курса', async () => {
      const { courseGetByUuid, getUserByUuid, uc } = setupUc();
      const mentor = makeUser([Role.MENTOR]);
      const course = makeModule(crypto.randomUUID(), 'projects');
      getUserByUuid.mockResolvedValueOnce(mentor);
      courseGetByUuid.mockResolvedValueOnce(course);

      await expect(
        uc.handle(
          {
            moduleId: course.uuid,
            projectId:
              (course as { projects?: { uuid: string }[] }).projects?.[0]
                ?.uuid ?? '',
            title: 'У',
          },
          mentor.uuid,
        ),
      ).rejects.toThrow('Вы не являетесь автором курса');
    });

    test('отклоняет несуществующего пользователя', async () => {
      const { getUserByUuid, uc } = setupUc();
      getUserByUuid.mockResolvedValueOnce(undefined);

      await expect(
        uc.handle(
          {
            moduleId: crypto.randomUUID(),
            projectId: crypto.randomUUID(),
            title: 'У',
          },
          'noone',
        ),
      ).rejects.toThrow('Пользователь не найден');
    });
  });
});
