import { describe, expect, mock, test } from 'bun:test';
import type { User } from '@u7/user/domain';
import { Role } from '@u7/user/domain';
import type { Course } from '#domain/course/entity';
import { Status } from '#domain/status';
import type { Step } from '#domain/step/entity';
import type { StepRepo } from '#domain/step/repo';
import { GetStepUc } from './get-step-uc';

function makeCourse(overrides: Partial<Course> = {}): Course {
  return {
    uuid: crypto.randomUUID(),
    kind: 'modules' as const,
    title: 'Курс',
    description: 'Описание',
    authorId: crypto.randomUUID(),
    status: Status.PUBLISHED,
    createdAt: '2026-05-01T12:00',
    modules: [],
    ...overrides,
  } as Course;
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

function makeStep(courseId: string): Step {
  return {
    uuid: crypto.randomUUID(),
    courseId,
    kind: 'text',
    description: 'Шаг',
    content: undefined,
    status: Status.PUBLISHED,
    createdAt: '2026-05-01T12:00',
    updatedAt: undefined,
  } as Step;
}

function setupUc() {
  const getByUuid = mock(
    async (_uuid: string): Promise<Step | undefined> => undefined,
  );
  const repo: StepRepo = {
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
  const uc = new GetStepUc();
  uc.init({
    courseRepo: {
      getByUuid: courseGetByUuid,
      getAll: mock(async () => []),
    } as never,
    lessonRepo: {} as never,
    stepRepo: repo,
    userFacade: { getUserByUuid } as never,
  });
  return { getByUuid, courseGetByUuid, getUserByUuid, uc };
}

describe('GetStepUc', () => {
  describe('SUCCESS', () => {
    test('возвращает PUBLISHED шаг без актора', async () => {
      const { getByUuid, courseGetByUuid, uc } = setupUc();
      const courseId = crypto.randomUUID();
      const step = makeStep(courseId);
      getByUuid.mockResolvedValueOnce(step);
      courseGetByUuid.mockResolvedValueOnce(makeCourse({ uuid: courseId }));
      const result = await uc.handle({ uuid: step.uuid });
      expect((result as Step).description).toBe('Шаг');
    });

    test('автор видит DRAFT шаг с actorId', async () => {
      const { getByUuid, courseGetByUuid, getUserByUuid, uc } = setupUc();
      const author = makeUser({ roles: [Role.MENTOR] });
      const courseId = crypto.randomUUID();
      const course = makeCourse({
        uuid: courseId,
        authorId: author.uuid,
        status: Status.DRAFT,
      });
      const step = makeStep(courseId);
      step.status = Status.DRAFT;
      getByUuid.mockResolvedValueOnce(step);
      courseGetByUuid.mockResolvedValueOnce(course);
      getUserByUuid.mockResolvedValueOnce(author);

      const result = await uc.handle({ uuid: step.uuid }, author.uuid);
      expect((result as Step).description).toBe('Шаг');
    });
  });

  describe('FAIL', () => {
    test('выбрасывает ошибку если шаг не найден', async () => {
      const { getByUuid, uc } = setupUc();
      getByUuid.mockResolvedValueOnce(undefined);
      await expect(uc.handle({ uuid: crypto.randomUUID() })).rejects.toThrow(
        'Шаг не найден',
      );
    });

    test('DRAFT шаг недоступен без актора (ACCESS_DENIED)', async () => {
      const { getByUuid, courseGetByUuid, uc } = setupUc();
      const courseId = crypto.randomUUID();
      const step = makeStep(courseId);
      step.status = Status.DRAFT;
      getByUuid.mockResolvedValueOnce(step);
      courseGetByUuid.mockResolvedValueOnce(makeCourse({ uuid: courseId }));
      await expect(uc.handle({ uuid: step.uuid })).rejects.toThrow(
        'Нет доступа к шагу',
      );
    });
  });
});
