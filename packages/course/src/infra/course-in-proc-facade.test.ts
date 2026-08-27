import { describe, expect, mock, test } from 'bun:test';
import { Status } from '#domain/status';
import { CourseInProcFacade } from './course-in-proc-facade';

describe('CourseInProcFacade', () => {
  test('делегирует getModuleSnapshot в CourseApiModule.execute', async () => {
    const mockSnapshot = [
      {
        projectId: 'p1',
        projectTitle: 'Проект',
        lessons: [],
      },
    ];

    const mockModule = {
      execute: mock(() => Promise.resolve(mockSnapshot)),
    };

    const facade = new CourseInProcFacade(mockModule as any);
    const result = await facade.getModuleSnapshot('mod-1');

    expect(result).toEqual(mockSnapshot);
    expect(mockModule.execute).toHaveBeenCalledTimes(1);
    expect(mockModule.execute).toHaveBeenCalledWith('get-module-snapshot', {
      moduleId: 'mod-1',
    });
  });

  test('возвращает результат от модуля без изменений', async () => {
    const mockModule = {
      execute: mock(() => Promise.resolve([])),
    };

    const facade = new CourseInProcFacade(mockModule as any);
    const result = await facade.getModuleSnapshot('nonexistent');

    expect(result).toEqual([]);
  });

  test('делегирует getStep в CourseApiModule.execute', async () => {
    const mockStep = {
      uuid: 'step-1',
      moduleId: 'mod-1',
      kind: 'text' as const,
      description: 'Описание шага',
      status: Status.PUBLISHED,
      createdAt: '2025-01-01T00:00:00.000Z',
    };

    const mockModule = {
      execute: mock(() => Promise.resolve(mockStep)),
    };

    const facade = new CourseInProcFacade(mockModule as any);
    const result = await facade.getStep('step-1');

    expect(result).toEqual(mockStep);
    expect(mockModule.execute).toHaveBeenCalledTimes(1);
    expect(mockModule.execute).toHaveBeenCalledWith('get-step', {
      uuid: 'step-1',
    });
  });

  test('getStep пробрасывает ошибку от модуля', async () => {
    const error = new Error('STEP_NOT_FOUND');
    const mockModule = {
      execute: mock(() => Promise.reject(error)),
    };

    const facade = new CourseInProcFacade(mockModule as any);

    await expect(facade.getStep('bad-id')).rejects.toThrow('STEP_NOT_FOUND');
  });

  describe('isCourseEnrollable', () => {
    function makeCourse(status: Status) {
      return {
        uuid: 'c-1',
        title: 'Course',
        authorId: 'a1',
        status,
        phases: [{ title: 'P1', moduleIds: ['m-1'] }],
        createdAt: '2026-01-01T00:00',
      };
    }

    test('опубликованный курс → true', async () => {
      const mockModule = {
        execute: mock(() => Promise.resolve(makeCourse(Status.PUBLISHED))),
      };
      const facade = new CourseInProcFacade(mockModule as any);

      expect(await facade.isCourseEnrollable('c-1')).toBe(true);
    });

    test('draft/archived курс → false (неотличим от несуществующего)', async () => {
      for (const status of [Status.DRAFT, Status.ARCHIVED]) {
        const mockModule = {
          execute: mock(() => Promise.resolve(makeCourse(status))),
        };
        const facade = new CourseInProcFacade(mockModule as any);

        expect(await facade.isCourseEnrollable('c-1')).toBe(false);
      }
    });

    test('несуществующий курс → false', async () => {
      const mockModule = {
        execute: mock(() => Promise.resolve(undefined)),
      };
      const facade = new CourseInProcFacade(mockModule as any);

      expect(await facade.isCourseEnrollable('nope')).toBe(false);
    });
  });

  describe('getCourseStartModuleId', () => {
    test('первый модуль линейного порядка фаз', async () => {
      const course = {
        uuid: 'c-1',
        title: 'Course',
        authorId: 'a1',
        status: Status.PUBLISHED,
        phases: [
          { title: 'P1', moduleIds: ['m-1', 'm-2'] },
          { title: 'P2', moduleIds: ['m-3'] },
        ],
        createdAt: '2026-01-01T00:00',
      };
      const mockModule = { execute: mock(() => Promise.resolve(course)) };
      const facade = new CourseInProcFacade(mockModule as any);

      expect(await facade.getCourseStartModuleId('c-1')).toBe('m-1');
    });

    test('пустая программа → undefined', async () => {
      const course = {
        uuid: 'c-1',
        title: 'Course',
        authorId: 'a1',
        status: Status.PUBLISHED,
        phases: [],
        createdAt: '2026-01-01T00:00',
      };
      const mockModule = { execute: mock(() => Promise.resolve(course)) };
      const facade = new CourseInProcFacade(mockModule as any);

      expect(await facade.getCourseStartModuleId('c-1')).toBeUndefined();
    });
  });

  describe('getModulePlace', () => {
    const m1 = '11111111-1111-4111-8111-111111111111';
    const m2 = '22222222-2222-4222-8222-222222222222';
    const m3 = '33333333-3333-4333-8333-333333333333';

    function makeCourses() {
      const mk = (
        uuid: string,
        moduleIds: string[],
        status = Status.PUBLISHED,
      ) => ({
        uuid,
        title: `Course ${uuid}`,
        authorId: 'a1',
        status,
        phases: [{ title: 'P1', moduleIds }],
        createdAt: '2026-01-01T00:00',
      });
      return [mk('c-1', [m1, m2, m3])];
    }

    test('первый модуль: isFirst=true, next', async () => {
      const mockModule = {
        execute: mock(() => Promise.resolve(makeCourses())),
      };
      const facade = new CourseInProcFacade(mockModule as any);

      const place = await facade.getModulePlace(m1);
      expect(place).toEqual({
        courseId: 'c-1',
        isFirst: true,
        isLast: false,
        nextModuleId: m2,
      });
    });

    test('средний модуль: prev и next', async () => {
      const mockModule = {
        execute: mock(() => Promise.resolve(makeCourses())),
      };
      const facade = new CourseInProcFacade(mockModule as any);

      const place = await facade.getModulePlace(m2);
      expect(place).toEqual({
        courseId: 'c-1',
        isFirst: false,
        isLast: false,
        prevModuleId: m1,
        nextModuleId: m3,
      });
    });

    test('последний модуль: isLast=true, prev', async () => {
      const mockModule = {
        execute: mock(() => Promise.resolve(makeCourses())),
      };
      const facade = new CourseInProcFacade(mockModule as any);

      const place = await facade.getModulePlace(m3);
      expect(place).toEqual({
        courseId: 'c-1',
        isFirst: false,
        isLast: true,
        prevModuleId: m2,
      });
    });

    test('модуль вне опубликованных курсов → undefined', async () => {
      const mockModule = {
        execute: mock(() => Promise.resolve(makeCourses())),
      };
      const facade = new CourseInProcFacade(mockModule as any);

      expect(await facade.getModulePlace('unknown')).toBeUndefined();
    });

    test('приоритет опубликованному курсу при форках', async () => {
      const mk = (uuid: string, moduleIds: string[], status: Status) => ({
        uuid,
        title: `Course ${uuid}`,
        authorId: 'a1',
        status,
        phases: [{ title: 'P1', moduleIds }],
        createdAt: '2026-01-01T00:00',
      });
      // Архивный содержит [m1, m2x], опубликованный [m1, m2, m3]
      const courses = [
        mk('c-arch', [m1, 'm-2x'], Status.ARCHIVED),
        mk('c-1', [m1, m2, m3], Status.PUBLISHED),
      ];
      const mockModule = { execute: mock(() => Promise.resolve(courses)) };
      const facade = new CourseInProcFacade(mockModule as any);

      const place = await facade.getModulePlace(m2);
      expect(place?.courseId).toBe('c-1');
      expect(place?.prevModuleId).toBe(m1);
    });
  });

  describe('isSameModule', () => {
    test('одинаковые id → true', async () => {
      const facade = new CourseInProcFacade({} as any);
      expect(await facade.isSameModule('m-1', 'm-1')).toBe(true);
    });

    test('разные id → false (сегодня; контракт — для будущих версий/копий)', async () => {
      const facade = new CourseInProcFacade({} as any);
      expect(await facade.isSameModule('m-1', 'm-2')).toBe(false);
    });
  });

  describe('whichCoursesIncludeModule', () => {
    const moduleId = '33333333-3333-4333-8333-333333333333';

    function makeCourse(
      uuid: string,
      moduleIds: string[],
      status: Status = Status.PUBLISHED,
    ) {
      return {
        uuid,
        title: `Course ${uuid}`,
        authorId: 'a1',
        status,
        phases: [{ title: 'P1', moduleIds }],
        createdAt: '2026-01-01T00:00',
      };
    }

    test('возвращает uuid курсов, чья программа содержит модуль', async () => {
      const withModule = makeCourse('c-1', [moduleId]);
      const withoutModule = makeCourse('c-2', ['other-module']);
      const mockModule = {
        execute: mock((name: string, cmd: { uuid: string }) => {
          if (name !== 'get-course') throw new Error(`unexpected ${name}`);
          return cmd.uuid === 'c-1'
            ? Promise.resolve(withModule)
            : Promise.resolve(withoutModule);
        }),
      };

      const facade = new CourseInProcFacade(mockModule as any);
      const result = await facade.whichCoursesIncludeModule(moduleId, [
        'c-1',
        'c-2',
      ]);

      expect(result).toEqual(['c-1']);
    });

    test('архивный курс тоже учитывается (историческая принадлежность)', async () => {
      const archived = makeCourse('c-arch', [moduleId], Status.ARCHIVED);
      const mockModule = {
        execute: mock(() => Promise.resolve(archived)),
      };

      const facade = new CourseInProcFacade(mockModule as any);
      const result = await facade.whichCoursesIncludeModule(moduleId, [
        'c-arch',
      ]);

      expect(result).toEqual(['c-arch']);
    });

    test('несуществующий курс — пропускается без ошибки', async () => {
      const mockModule = {
        execute: mock(() => Promise.resolve(undefined)),
      };

      const facade = new CourseInProcFacade(mockModule as any);
      const result = await facade.whichCoursesIncludeModule(moduleId, ['nope']);

      expect(result).toEqual([]);
    });

    test('пустой список courseIds — пустой результат без обращения к модулю', async () => {
      const mockModule = {
        execute: mock(() => Promise.resolve([])),
      };

      const facade = new CourseInProcFacade(mockModule as any);
      const result = await facade.whichCoursesIncludeModule(moduleId, []);

      expect(result).toEqual([]);
      expect(mockModule.execute).not.toHaveBeenCalled();
    });
  });
});
