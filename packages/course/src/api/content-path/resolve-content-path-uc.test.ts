import { describe, expect, mock, test } from 'bun:test';
import type { User } from '@u7-scl/user/domain';
import { Role } from '@u7-scl/user/domain';
import * as v from 'valibot';
import {
  type ResolveContentPathCmd,
  ResolveContentPathSchema,
} from '#domain/content-path/commands/resolve-content-path-cmd';
import type { CourseApiModuleResolver } from '#domain/module';
import { Status } from '#domain/status';
import { ResolveContentPathUc } from './resolve-content-path-uc';

// ============================================================
// Helpers
// ============================================================

function makeUser(overrides: Partial<User> = {}): User {
  return {
    uuid: 'u1',
    name: 'Тест',
    telegramId: 1,
    roles: [Role.STUDENT],
    createdAt: '2026-05-01',
    ...overrides,
  };
}

/** Создаёт Module с одним проектом и двумя уроками */
function makeModule(): any {
  return {
    uuid: 'mid-1',
    title: 'Тестовый модуль',
    description: '...',
    authorId: 'author-1',
    status: Status.PUBLISHED,
    targetAudience: 'Все',
    goal: 'Цель',
    result: 'Результат',
    rules: 'Правила',
    createdAt: '2026-05-01',
    projects: [
      {
        uuid: 'pid-1',
        title: 'Проект 1',
        status: Status.PUBLISHED,
        lessonIds: ['lid-1a', 'lid-1b'],
      },
      {
        uuid: 'pid-2',
        title: 'Проект 2',
        status: Status.PUBLISHED,
        lessonIds: ['lid-2a'],
      },
    ],
  };
}

function makeLessons(): any[] {
  return [
    {
      uuid: 'lid-1a',
      moduleId: 'mid-1',
      title: 'Урок 1.1',
      status: Status.PUBLISHED,
      stepIds: ['sid-1a-1', 'sid-1a-2'],
      mentorStepIds: [],
      createdAt: '2026-05-01',
    },
    {
      uuid: 'lid-1b',
      moduleId: 'mid-1',
      title: 'Урок 1.2',
      status: Status.PUBLISHED,
      stepIds: ['sid-1b-1'],
      mentorStepIds: [],
      createdAt: '2026-05-01',
    },
    {
      uuid: 'lid-2a',
      moduleId: 'mid-1',
      title: 'Урок 2.1',
      status: Status.PUBLISHED,
      stepIds: ['sid-2a-1', 'sid-2a-2', 'sid-2a-3'],
      mentorStepIds: [],
      createdAt: '2026-05-01',
    },
  ];
}

function makeCourse(): any {
  return {
    uuid: 'cid-1',
    title: 'Курс',
    description: 'Описание',
    authorId: 'author-1',
    status: Status.PUBLISHED,
    createdAt: '2026-05-01',
    phases: [
      {
        title: 'Фаза 1',
        track: 'tech',
        moduleIds: ['mid-1', 'mid-2'],
      },
    ],
  };
}

function makeStep(stepId = 'sid-1a-1'): any {
  return {
    uuid: stepId,
    moduleId: 'mid-1',
    kind: 'text',
    description: `Шаг ${stepId}`,
    content: `Контент ${stepId}`,
    status: Status.PUBLISHED,
    createdAt: '2026-05-01',
  };
}

type UcEnv = {
  getUserByUuid: ReturnType<typeof mock>;
  courseRepoGetByUuid: ReturnType<typeof mock>;
  moduleRepoGetByUuid: ReturnType<typeof mock>;
  lessonRepoGetByUuid: ReturnType<typeof mock>;
  stepRepoGetByUuid: ReturnType<typeof mock>;
  uc: ResolveContentPathUc;
};

function setupUc(): UcEnv {
  const getUserByUuid = mock(
    async (_userId: string, _actorId?: string): Promise<User | undefined> =>
      undefined,
  );
  const courseRepoGetByUuid = mock(async () => undefined);
  const moduleRepoGetByUuid = mock(async () => undefined);
  const lessonRepoGetByUuid = mock(async () => undefined);
  const stepRepoGetByUuid = mock(async () => undefined);

  const uc = new ResolveContentPathUc();
  uc.init({
    moduleRepo: {
      getByUuid: moduleRepoGetByUuid,
      getAll: mock(async () => []),
    } as never,
    lessonRepo: {
      getByUuid: lessonRepoGetByUuid,
    } as never,
    stepRepo: {
      getByUuid: stepRepoGetByUuid,
      getByIds: mock(async () => []),
      getByCourseId: mock(async () => []),
      save: mock(async () => {}),
    } as never,
    courseRepo: {
      getByUuid: courseRepoGetByUuid,
      getAll: mock(async () => []),
      save: mock(async () => {}),
    } as never,
    userFacade: { getUserByUuid } as never,
  } as unknown as CourseApiModuleResolver);

  return {
    getUserByUuid,
    courseRepoGetByUuid,
    moduleRepoGetByUuid,
    lessonRepoGetByUuid,
    stepRepoGetByUuid,
    uc,
  };
}

/** Настраивает репо для возврата типичной программы курса */
function setupProgramMocks(env: UcEnv): void {
  env.courseRepoGetByUuid.mockResolvedValueOnce(makeCourse());
  env.moduleRepoGetByUuid.mockResolvedValueOnce(makeModule());
  // mid-2 не существует → вернёт undefined
  env.moduleRepoGetByUuid.mockResolvedValueOnce(undefined);

  const lessons = makeLessons();
  // lessonRepo вызывается для lid-1a, lid-1b, lid-2a
  for (const id of ['lid-1a', 'lid-1b', 'lid-2a']) {
    const lesson = lessons.find((l) => l.uuid === id);
    env.lessonRepoGetByUuid.mockResolvedValueOnce(lesson);
  }
}

// ============================================================
// Tests
// ============================================================

describe('ContentPathSchema', () => {
  test('валидная команда — path + courseId', () => {
    const cmd: ResolveContentPathCmd = { path: '1:2:3:4', courseId: 'cid-1' };
    expect(() => v.parse(ResolveContentPathSchema, cmd)).not.toThrow();
  });

  test('валидная команда — path + streamId', () => {
    const cmd: ResolveContentPathCmd = { path: '1', streamId: 'sid-1' };
    expect(() => v.parse(ResolveContentPathSchema, cmd)).not.toThrow();
  });

  test('невалидная команда — нет ни courseId ни streamId', () => {
    const cmd = { path: '1:2' };
    expect(() => v.parse(ResolveContentPathSchema, cmd)).toThrow();
  });

  test('невалидная команда — пустой path', () => {
    const cmd = { path: '', courseId: 'cid-1' };
    expect(() => v.parse(ResolveContentPathSchema, cmd)).toThrow();
  });
});

describe('ResolveContentPathUc', () => {
  describe('SUCCESS — роли', () => {
    test('curious (без actorId) — видит только заголовки, без content/code', async () => {
      const env = setupUc();
      setupProgramMocks(env);

      const result: any = await env.uc.handle({
        path: '1',
        courseId: 'cid-1',
      });

      expect(result).toBeDefined();
      expect(result.moduleIndex).toBe(1);
    });

    test('student — видит структуру', async () => {
      const env = setupUc();
      setupProgramMocks(env);
      const student = makeUser({ roles: [Role.STUDENT] });
      env.getUserByUuid.mockResolvedValueOnce(student);

      const result: any = await env.uc.handle(
        { path: '1', courseId: 'cid-1' },
        student.uuid,
      );

      expect(result).toBeDefined();
    });

    test('mentor — полный доступ', async () => {
      const env = setupUc();
      setupProgramMocks(env);
      const mentor = makeUser({ roles: [Role.MENTOR] });
      env.getUserByUuid.mockResolvedValueOnce(mentor);

      const result: any = await env.uc.handle(
        { path: '1', courseId: 'cid-1' },
        mentor.uuid,
      );

      expect(result).toBeDefined();
    });
  });

  describe('SUCCESS — уровни пути', () => {
    test('A (модуль) — возвращает структуру модуля', async () => {
      const env = setupUc();
      setupProgramMocks(env);

      const result: any = await env.uc.handle({
        path: '1',
        courseId: 'cid-1',
      });

      expect(result).toHaveProperty('moduleTitle');
    });

    test('A:B (проект) — возвращает проект с уроками', async () => {
      const env = setupUc();
      setupProgramMocks(env);

      const result: any = await env.uc.handle({
        path: '1:1',
        courseId: 'cid-1',
      });

      expect(result).toHaveProperty('projectTitle');
      expect(result).toHaveProperty('lessons');
    });

    test('A:B:C (урок) — возвращает урок', async () => {
      const env = setupUc();
      setupProgramMocks(env);

      const result: any = await env.uc.handle({
        path: '1:1:1',
        courseId: 'cid-1',
      });

      expect(result).toHaveProperty('lessonTitle');
    });

    test('A:B:C:D (шаг) — возвращает шаг, curious без content', async () => {
      const env = setupUc();
      setupProgramMocks(env);
      env.stepRepoGetByUuid.mockResolvedValueOnce(makeStep('sid-1a-1'));
      env.stepRepoGetByUuid.mockResolvedValueOnce(makeStep('sid-1a-2'));

      const result: any = await env.uc.handle({
        path: '1:1:1:1',
        courseId: 'cid-1',
      });

      // curious: шаг виден, но без content
      expect(result.step).toBeDefined();
      expect(result.step?.content).toBeUndefined();
      expect(result.step?.code).toBeUndefined();
    });

    test('A:B:C:D — ментор видит content', async () => {
      const env = setupUc();
      setupProgramMocks(env);
      const mentor = makeUser({ roles: [Role.MENTOR] });
      env.getUserByUuid.mockResolvedValueOnce(mentor);
      env.stepRepoGetByUuid.mockResolvedValueOnce(makeStep('sid-1a-1'));
      env.stepRepoGetByUuid.mockResolvedValueOnce(makeStep('sid-1a-2'));

      const result: any = await env.uc.handle(
        { path: '1:1:1:1', courseId: 'cid-1' },
        mentor.uuid,
      );

      expect(result.step).toBeDefined();
      expect(result.step?.content).toBeDefined();
    });

    test('A:B:C:all — все шаги урока', async () => {
      const env = setupUc();
      setupProgramMocks(env);
      env.stepRepoGetByUuid.mockResolvedValueOnce(makeStep('sid-1a-1'));
      env.stepRepoGetByUuid.mockResolvedValueOnce(makeStep('sid-1a-2'));

      const result: any = await env.uc.handle({
        path: '1:1:1:all',
        courseId: 'cid-1',
      });

      expect(result).toBeDefined();
      expect(result.steps?.length).toBe(2);
    });
  });

  describe('FAIL', () => {
    test('несуществующий индекс модуля — ошибка', async () => {
      const env = setupUc();
      setupProgramMocks(env);

      await expect(
        env.uc.handle({ path: '99', courseId: 'cid-1' }),
      ).rejects.toThrow('Модуль не найден');
    });

    test('несуществующий индекс проекта — ошибка', async () => {
      const env = setupUc();
      setupProgramMocks(env);

      await expect(
        env.uc.handle({ path: '1:99', courseId: 'cid-1' }),
      ).rejects.toThrow('Проект не найден');
    });

    test('несуществующий индекс урока — ошибка', async () => {
      const env = setupUc();
      setupProgramMocks(env);

      await expect(
        env.uc.handle({ path: '1:1:99', courseId: 'cid-1' }),
      ).rejects.toThrow('Урок не найден');
    });

    test('несуществующий индекс шага — ошибка', async () => {
      const env = setupUc();
      setupProgramMocks(env);
      env.stepRepoGetByUuid.mockResolvedValueOnce(makeStep('sid-1a-1'));
      env.stepRepoGetByUuid.mockResolvedValueOnce(makeStep('sid-1a-2'));

      await expect(
        env.uc.handle({ path: '1:1:1:99', courseId: 'cid-1' }),
      ).rejects.toThrow('Шаг не найден');
    });

    test('невалидный формат пути — ошибка', async () => {
      const env = setupUc();

      await expect(
        env.uc.handle({ path: 'abc', courseId: 'cid-1' }),
      ).rejects.toThrow('Некорректный формат ContentPath');
    });
  });
});
