import { describe, expect, mock, test } from 'bun:test';
import type { User, UserFacade } from '@u7/user/domain';
import { Role } from '@u7/user/domain';
import type { Course } from '#domain/course/entity';
import type { CourseRepo } from '#domain/course/repo';
import { Status } from '#domain/status';
import { AddProjectToModuleUc } from './add-project-to-module-uc';

function makeUser(r: Role[] = [Role.MENTOR]): User {
  return {
    uuid: crypto.randomUUID(),
    name: 'Т',
    telegramId: 1,
    roles: r,
    createdAt: '2026-05-01T12:00',
  };
}

function makeModuleCourse(authorId: string): Course {
  return {
    uuid: crypto.randomUUID(),
    kind: 'modules',
    title: 'К',
    description: 'О',
    authorId,
    targetAudience: undefined,
    goal: undefined,
    result: undefined,
    rules: undefined,
    additional: undefined,
    tags: [],
    status: Status.DRAFT,
    createdAt: '2026-05-01T12:00',
    modules: [
      {
        uuid: crypto.randomUUID(),
        title: 'Модуль 1',
        status: Status.DRAFT,
        projects: [],
      },
    ],
  } as Course;
}

function setupUc() {
  const save = mock(async (_c: Course): Promise<void> => {});
  const getByUuid = mock(
    async (_uuid: string): Promise<Course | undefined> => undefined,
  );
  const getAll = mock(async (): Promise<Course[]> => []);
  const repo: CourseRepo = { save, getByUuid, getAll };
  const getUserByUuid = mock(
    async (_uuid: string): Promise<User | undefined> => undefined,
  );
  const userFacade: any = {
    getUserByUuid,
    userExists: mock(async () => false),
    addRoleToUser: mock(),
  };
  const uc = new AddProjectToModuleUc();
  uc.init({
    courseRepo: repo,
    lessonRepo: {} as never,
    stepRepo: {} as never,
    userFacade,
  });
  return { save, getByUuid, getUserByUuid, uc };
}

describe('AddProjectToModuleUc', () => {
  describe('SUCCESS', () => {
    test('автор добавляет проект в модуль своего курса', async () => {
      const { getByUuid, getUserByUuid, save, uc } = setupUc();
      const mentor = makeUser();
      const course = makeModuleCourse(mentor.uuid);
      const mods = (course as { modules: { uuid: string }[] }).modules;
      const moduleUuid = mods[0]?.uuid as string;
      getByUuid.mockResolvedValueOnce(course);
      getUserByUuid.mockResolvedValueOnce(mentor);

      const result = await uc.handle(
        {
          courseId: course.uuid,
          moduleUuid,
          title: 'Проект в модуле',
        },
        mentor.uuid,
      );

      const res = result as Course & {
        modules: { projects: { title: string }[] }[];
      };
      const mod = res.modules[0];
      expect(mod).toBeDefined();
      if (!mod) throw new Error('Expected module');
      expect(mod.projects).toHaveLength(1);
      expect(mod.projects[0]?.title).toBe('Проект в модуле');
      expect(save).toHaveBeenCalledTimes(1);
    });
  });

  describe('FAIL', () => {
    test('отклоняет если модуль не найден', async () => {
      const { getByUuid, getUserByUuid, uc } = setupUc();
      const mentor = makeUser();
      const course = makeModuleCourse(mentor.uuid);
      getByUuid.mockResolvedValueOnce(course);
      getUserByUuid.mockResolvedValueOnce(mentor);

      await expect(
        uc.handle(
          {
            courseId: course.uuid,
            moduleUuid: crypto.randomUUID(),
            title: 'П',
          },
          mentor.uuid,
        ),
      ).rejects.toThrow('Модуль не найден');
    });

    test('отклоняет для kind=projects', async () => {
      const { getByUuid, getUserByUuid, uc } = setupUc();
      const mentor = makeUser();
      const course = {
        ...makeModuleCourse(mentor.uuid),
        kind: 'projects' as const,
        projects: [],
        modules: undefined,
      } as unknown as Course;
      getByUuid.mockResolvedValueOnce(course);
      getUserByUuid.mockResolvedValueOnce(mentor);

      await expect(
        uc.handle(
          {
            courseId: course.uuid,
            moduleUuid: crypto.randomUUID(),
            title: 'П',
          },
          mentor.uuid,
        ),
      ).rejects.toThrow(
        "Нельзя добавить проект в модуль курса с kind='projects'",
      );
    });

    test('отклоняет чужого редактора', async () => {
      const { getByUuid, getUserByUuid, uc } = setupUc();
      const course = makeModuleCourse('author-id');
      const other = makeUser([Role.STUDENT]);
      getByUuid.mockResolvedValueOnce(course);
      getUserByUuid.mockResolvedValueOnce(other);

      await expect(
        uc.handle(
          {
            courseId: course.uuid,
            moduleUuid: crypto.randomUUID(),
            title: 'П',
          },
          other.uuid,
        ),
      ).rejects.toThrow('Недостаточно прав');
    });
  });
});
