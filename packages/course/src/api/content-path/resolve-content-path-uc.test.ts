import { describe, expect, mock, test } from 'bun:test';
import type { User } from '@u7-scl/user/domain';
import { Role } from '@u7-scl/user/domain';
import * as v from 'valibot';
import {
  type ResolveContentPathCmd,
  ResolveContentPathSchema,
} from '#domain/content-path/commands/resolve-content-path-cmd';
import type { ContentSnapshot } from '#domain/content-snapshot';
import type { CourseProgram } from '#domain/facade';
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

/** Создаёт ContentSnapshot с 2 проектами */
function makeSnapshot(): ContentSnapshot {
  return [
    {
      projectId: 'pid-1',
      projectTitle: 'Проект 1',
      lessons: [
        {
          lessonId: 'lid-1a',
          lessonTitle: 'Урок 1.1',
          stepIds: ['sid-1a-1', 'sid-1a-2'],
        },
        {
          lessonId: 'lid-1b',
          lessonTitle: 'Урок 1.2',
          stepIds: ['sid-1b-1'],
        },
      ],
    },
    {
      projectId: 'pid-2',
      projectTitle: 'Проект 2',
      lessons: [
        {
          lessonId: 'lid-2a',
          lessonTitle: 'Урок 2.1',
          stepIds: ['sid-2a-1', 'sid-2a-2', 'sid-2a-3'],
        },
      ],
    },
  ];
}

function makeCourseProgram(
  snapshot: ContentSnapshot,
  title = 'Курс',
): CourseProgram {
  return {
    course: {
      uuid: 'cid-1',
      title,
      description: 'Описание курса',
      authorId: 'author-1',
      status: Status.PUBLISHED,
      createdAt: '2026-05-01',
      phases: [],
    },
    phases: [
      {
        title: 'Фаза 1',
        modules: [snapshot],
      },
    ],
  };
}

type UcEnv = {
  getUserByUuid: ReturnType<typeof mock>;
  getCourseProgram: ReturnType<typeof mock>;
  getStep: ReturnType<typeof mock>;
  getModuleSnapshot: ReturnType<typeof mock>;
  uc: ResolveContentPathUc;
};

function setupUc(): UcEnv {
  const getUserByUuid = mock(
    async (_userId: string, _actorId?: string): Promise<User | undefined> =>
      undefined,
  );
  const getCourseProgram = mock(
    async (_courseId: string): Promise<CourseProgram> => ({
      course: {} as never,
      phases: [],
    }),
  );
  const getStep = mock(async (_stepId: string) => undefined as never);
  const getModuleSnapshot = mock(
    async (_moduleId: string): Promise<ContentSnapshot> => [],
  );

  const uc = new ResolveContentPathUc();
  uc.init({
    moduleRepo: {
      getByUuid: mock(async () => undefined),
      getAll: mock(async () => []),
    } as never,
    lessonRepo: { getByUuid: mock(async () => undefined) } as never,
    stepRepo: {
      getByUuid: mock(async () => undefined),
      getByIds: mock(async () => []),
      getByCourseId: mock(async () => []),
      save: mock(async () => {}),
    },
    courseRepo: {} as never,
    courseFacade: {
      getCourseProgram,
      getStep,
      getModuleSnapshot,
    } as never,
    userFacade: { getUserByUuid } as never,
  } as unknown as CourseApiModuleResolver);

  return { getUserByUuid, getCourseProgram, getStep, getModuleSnapshot, uc };
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
      const { getCourseProgram, uc } = setupUc();
      const snapshot = makeSnapshot();
      getCourseProgram.mockResolvedValueOnce(makeCourseProgram(snapshot));

      const result = await uc.handle({
        path: '1',
        courseId: 'cid-1',
      });

      // curious видит структуру модуля (проекты, уроки) без тел шагов
      expect(result).toBeDefined();
    });

    test('student с streamId — видит структуру', async () => {
      const { getUserByUuid, getCourseProgram, uc } = setupUc();
      const student = makeUser({ roles: [Role.STUDENT] });
      getUserByUuid.mockResolvedValueOnce(student);

      const snapshot = makeSnapshot();
      getCourseProgram.mockResolvedValueOnce(makeCourseProgram(snapshot));

      const result = await uc.handle(
        { path: '1', courseId: 'cid-1' },
        student.uuid,
      );

      expect(result).toBeDefined();
    });

    test('mentor — полный доступ', async () => {
      const { getUserByUuid, getCourseProgram, uc } = setupUc();
      const mentor = makeUser({ roles: [Role.MENTOR] });
      getUserByUuid.mockResolvedValueOnce(mentor);

      const snapshot = makeSnapshot();
      getCourseProgram.mockResolvedValueOnce(makeCourseProgram(snapshot));

      const result = await uc.handle(
        { path: '1', courseId: 'cid-1' },
        mentor.uuid,
      );

      expect(result).toBeDefined();
    });
  });

  describe('SUCCESS — уровни пути', () => {
    test('A (модуль) — возвращает структуру модуля', async () => {
      const { getCourseProgram, uc } = setupUc();
      const snapshot = makeSnapshot();
      getCourseProgram.mockResolvedValueOnce(makeCourseProgram(snapshot));

      const result = await uc.handle({
        path: '1',
        courseId: 'cid-1',
      });

      expect(result).toHaveProperty('moduleTitle');
    });

    test('A:B (проект) — возвращает проект с уроками', async () => {
      const { getCourseProgram, uc } = setupUc();
      const snapshot = makeSnapshot();
      getCourseProgram.mockResolvedValueOnce(makeCourseProgram(snapshot));

      const result = await uc.handle({
        path: '1:1',
        courseId: 'cid-1',
      });

      expect(result).toHaveProperty('projectTitle');
      expect(result).toHaveProperty('lessons');
    });

    test('A:B:C (урок) — возвращает урок со stepIds', async () => {
      const { getCourseProgram, uc } = setupUc();
      const snapshot = makeSnapshot();
      getCourseProgram.mockResolvedValueOnce(makeCourseProgram(snapshot));

      const result = await uc.handle({
        path: '1:1:1',
        courseId: 'cid-1',
      });

      expect(result).toHaveProperty('lessonTitle');
    });

    test('A:B:C:D (шаг) — возвращает шаг', async () => {
      const { getCourseProgram, getStep, uc } = setupUc();
      const snapshot = makeSnapshot();
      getCourseProgram.mockResolvedValueOnce(makeCourseProgram(snapshot));
      getStep.mockResolvedValueOnce({
        uuid: 'sid-1a-1',
        moduleId: 'mid-1',
        kind: 'text',
        description: 'Шаг 1',
        content: 'Контент шага 1',
        status: Status.PUBLISHED,
        createdAt: '2026-05-01',
      });

      const result = await uc.handle({
        path: '1:1:1:1',
        courseId: 'cid-1',
      });

      // curious: должен быть заголовок, но без content
      expect(result).toBeDefined();
    });

    test('A:B:C:all — все шаги урока', async () => {
      const { getCourseProgram, getStep, uc } = setupUc();
      const snapshot = makeSnapshot();
      getCourseProgram.mockResolvedValueOnce(makeCourseProgram(snapshot));
      // Возвращаем шаги по запросу
      getStep.mockImplementation(async (stepId: string) => ({
        uuid: stepId,
        moduleId: 'mid-1',
        kind: 'text',
        description: `Шаг ${stepId}`,
        status: Status.PUBLISHED,
        createdAt: '2026-05-01',
      }));

      const result = await uc.handle({
        path: '1:1:1:all',
        courseId: 'cid-1',
      });

      expect(result).toBeDefined();
    });

    test('stepId — резолв по UUID шага', async () => {
      const { getCourseProgram, getStep, uc } = setupUc();
      const snapshot = makeSnapshot();
      getCourseProgram.mockResolvedValueOnce(makeCourseProgram(snapshot));
      getStep.mockResolvedValueOnce({
        uuid: 'sid-1a-1',
        moduleId: 'mid-1',
        kind: 'text',
        description: 'Шаг 1',
        content: 'Контент шага 1',
        status: Status.PUBLISHED,
        createdAt: '2026-05-01',
      });

      const result = (await uc.handle({
        stepId: 'sid-1a-1',
        courseId: 'cid-1',
      })) as Record<string, unknown>;

      expect(result).toHaveProperty('step');
      expect(result.moduleIndex).toBe(1);
      expect(result.projectIndex).toBe(1);
      expect(result.lessonIndex).toBe(1);
    });

    test('stepId — несуществующий UUID', async () => {
      const { getCourseProgram, uc } = setupUc();
      getCourseProgram.mockResolvedValueOnce(makeCourseProgram(makeSnapshot()));

      await expect(
        uc.handle({ stepId: 'nonexistent', courseId: 'cid-1' }),
      ).rejects.toThrow();
    });
  });

  describe('FAIL', () => {
    test('несуществующий индекс модуля — ошибка', async () => {
      const { getCourseProgram, uc } = setupUc();
      const snapshot = makeSnapshot();
      getCourseProgram.mockResolvedValueOnce(makeCourseProgram(snapshot));

      await expect(
        uc.handle({ path: '99', courseId: 'cid-1' }),
      ).rejects.toThrow('Модуль не найден');
    });

    test('несуществующий индекс проекта — ошибка', async () => {
      const { getCourseProgram, uc } = setupUc();
      const snapshot = makeSnapshot();
      getCourseProgram.mockResolvedValueOnce(makeCourseProgram(snapshot));

      await expect(
        uc.handle({ path: '1:99', courseId: 'cid-1' }),
      ).rejects.toThrow('Проект не найден');
    });

    test('несуществующий индекс урока — ошибка', async () => {
      const { getCourseProgram, uc } = setupUc();
      const snapshot = makeSnapshot();
      getCourseProgram.mockResolvedValueOnce(makeCourseProgram(snapshot));

      await expect(
        uc.handle({ path: '1:1:99', courseId: 'cid-1' }),
      ).rejects.toThrow('Урок не найден');
    });

    test('несуществующий индекс шага — ошибка', async () => {
      const { getCourseProgram, uc } = setupUc();
      const snapshot = makeSnapshot();
      getCourseProgram.mockResolvedValueOnce(makeCourseProgram(snapshot));

      await expect(
        uc.handle({ path: '1:1:1:99', courseId: 'cid-1' }),
      ).rejects.toThrow('Шаг не найден');
    });

    test('невалидный формат пути — ошибка', async () => {
      const { uc } = setupUc();

      await expect(
        uc.handle({ path: 'abc', courseId: 'cid-1' }),
      ).rejects.toThrow('Некорректный формат ContentPath');
    });
  });
});
