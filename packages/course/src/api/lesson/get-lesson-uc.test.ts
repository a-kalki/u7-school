import { describe, expect, mock, test } from 'bun:test';
import type { User } from '@u7-scl/user/domain';
import { Role } from '@u7-scl/user/domain';
import type { Module } from '#domain/module/entity';
import type { Lesson } from '#domain/lesson/entity';
import type { LessonRepo } from '#domain/lesson/repo';
import { Status } from '#domain/status';
import { GetLessonUc } from './get-lesson-uc';

function makeModule(overrides: Partial<Module> = {}): Module {
  return {
    uuid: crypto.randomUUID(),
    title: 'Курс',
    description: 'Описание',
    authorId: crypto.randomUUID(),
    status: Status.PUBLISHED,
    createdAt: '2026-05-01T12:00',
    projects: [],
    ...overrides,
  } as Module;
}

function makeUser(overrides: Partial<User> = {}): User {
  return {
    uuid: crypto.randomUUID(),
    name: 'Тест',
    telegramId: 1,
    roles: [Role.STUDENT],
    createdAt: '2026-05-01T12:00',
    ...overrides,
  };
}

function makeLesson(moduleId: string): Lesson {
  return {
    uuid: crypto.randomUUID(),
    courseId,
    title: 'Урок',
    additional: undefined,
    status: Status.PUBLISHED,
    estimatedMinutes: undefined,
    createdAt: '2026-05-01T12:00',
    updatedAt: undefined,
    stepIds: [],
    mentorStepIds: [],
  };
}

function setupUc() {
  const getByUuid = mock(
    async (_uuid: string): Promise<Lesson | undefined> => undefined,
  );
  const repo: LessonRepo = {
    save: mock(async () => {}),
    getByUuid,
    getByIds: mock(async () => []),
    getByCourseId: mock(async () => []),
  };
  const courseGetByUuid = mock(
    async (_uuid: string): Promise<Course | undefined> => undefined,
  );
  const getUserByUuid = mock(
    async (_userId: string, _actorId?: string): Promise<User | undefined> =>
      undefined,
  );
  const uc = new GetLessonUc();
  uc.init({
    courseRepo: {
      getByUuid: courseGetByUuid,
      getAll: mock(async () => []),
    } as never,
    lessonRepo: repo,
    stepRepo: {} as never,
    userFacade: { getUserByUuid } as never,
  });
  return { getByUuid, courseGetByUuid, getUserByUuid, uc };
}

describe('GetLessonUc', () => {
  describe('SUCCESS', () => {
    test('возвращает PUBLISHED урок без актора', async () => {
      const { getByUuid, courseGetByUuid, uc } = setupUc();
      const courseId = crypto.randomUUID();
      const lesson = makeLesson(courseId);
      getByUuid.mockResolvedValueOnce(lesson);
      courseGetByUuid.mockResolvedValueOnce(makeModule({ uuid: courseId }));
      const result = await uc.handle({ uuid: lesson.uuid });
      expect((result as Lesson).title).toBe('Урок');
    });

    test('автор видит DRAFT урок с actorId', async () => {
      const { getByUuid, courseGetByUuid, getUserByUuid, uc } = setupUc();
      const author = makeUser({ roles: [Role.MENTOR] });
      const courseId = crypto.randomUUID();
      const course = makeModule({
        uuid: courseId,
        authorId: author.uuid,
        status: Status.DRAFT,
      });
      const lesson = makeLesson(courseId);
      lesson.status = Status.DRAFT;
      getByUuid.mockResolvedValueOnce(lesson);
      courseGetByUuid.mockResolvedValueOnce(course);
      getUserByUuid.mockResolvedValueOnce(author);

      const result = await uc.handle({ uuid: lesson.uuid }, author.uuid);
      expect((result as Lesson).title).toBe('Урок');
    });
  });

  describe('FAIL', () => {
    test('выбрасывает ошибку если урок не найден', async () => {
      const { getByUuid, uc } = setupUc();
      getByUuid.mockResolvedValueOnce(undefined);
      await expect(uc.handle({ uuid: crypto.randomUUID() })).rejects.toThrow(
        'Урок не найден',
      );
    });

    test('DRAFT урок недоступен без актора (ACCESS_DENIED)', async () => {
      const { getByUuid, courseGetByUuid, uc } = setupUc();
      const courseId = crypto.randomUUID();
      const lesson = makeLesson(courseId);
      lesson.status = Status.DRAFT;
      getByUuid.mockResolvedValueOnce(lesson);
      courseGetByUuid.mockResolvedValueOnce(makeModule({ uuid: courseId }));
      await expect(uc.handle({ uuid: lesson.uuid })).rejects.toThrow(
        'Нет доступа к уроку',
      );
    });
  });
});
