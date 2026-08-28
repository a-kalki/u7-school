import { describe, expect, mock, test } from 'bun:test';
import type { CourseProgram } from '#domain/course/commands/get-course-program-cmd';
import type { Course } from '#domain/course/entity';
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
    const m2 = '22222222-2222-4222-8222-222222222222';

    test('делегирует в get-module-place и возвращает результат', async () => {
      const place = { courseId: 'c-1', isFirst: false, isLast: true };
      const mockModule = {
        execute: mock(async (name: string) => {
          if (name === 'get-module-place') return place;
          throw new Error(`unexpected ${name}`);
        }),
      };
      const facade = new CourseInProcFacade(mockModule as any);

      expect(await facade.getModulePlace(m2)).toEqual(place);
      expect(mockModule.execute).toHaveBeenCalledWith('get-module-place', {
        moduleId: m2,
      });
    });

    test('undefined от модуля проксируется', async () => {
      const mockModule = {
        execute: mock(async () => undefined),
      };
      const facade = new CourseInProcFacade(mockModule as any);

      expect(await facade.getModulePlace('unknown')).toBeUndefined();
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

    test('делегирует в which-courses-include-module и возвращает результат', async () => {
      const mockModule = {
        execute: mock(() => Promise.resolve(['c-1'])),
      };

      const facade = new CourseInProcFacade(mockModule as any);
      const result = await facade.whichCoursesIncludeModule(moduleId, [
        'c-1',
        'c-2',
      ]);

      expect(result).toEqual(['c-1']);
      expect(mockModule.execute).toHaveBeenCalledWith(
        'which-courses-include-module',
        { moduleId, courseIds: ['c-1', 'c-2'] },
      );
    });
  });

  describe('whichModulesAreSame', () => {
    test('возвращает только совпадающие id модулей (с сохранением дублей)', async () => {
      const facade = new CourseInProcFacade({} as any);
      const result = await facade.whichModulesAreSame('m-1', [
        'm-1',
        'm-2',
        'm-1',
      ]);
      expect(result).toEqual(['m-1', 'm-1']);
    });

    test('нет совпадений — пустой массив', async () => {
      const facade = new CourseInProcFacade({} as any);
      const result = await facade.whichModulesAreSame('m-1', ['m-2', 'm-3']);
      expect(result).toEqual([]);
    });

    test('пустой список кандидатов — пустой массив', async () => {
      const facade = new CourseInProcFacade({} as any);
      const result = await facade.whichModulesAreSame('m-1', []);
      expect(result).toEqual([]);
    });
  });

  describe('getCourseByModuleId', () => {
    test('делегирует в get-course-by-module', async () => {
      const course = { uuid: 'c-1', title: 'Course' } as Course;
      const mockModule = {
        execute: mock((): Promise<unknown> => Promise.resolve(course)),
      };

      const facade = new CourseInProcFacade(mockModule as any);
      expect(await facade.getCourseByModuleId('m-1')).toBe(course);
      expect(mockModule.execute).toHaveBeenCalledWith('get-course-by-module', {
        moduleId: 'm-1',
      });
    });
  });

  describe('getCourseProgram', () => {
    test('делегирует в get-course-program', async () => {
      const program = {
        course: { uuid: 'c-1' },
        phases: [{ title: 'P1', modules: [] }],
      } as unknown as CourseProgram;
      const mockModule = {
        execute: mock((): Promise<unknown> => Promise.resolve(program)),
      };

      const facade = new CourseInProcFacade(mockModule as any);
      expect(await facade.getCourseProgram('c-1')).toBe(program);
      expect(mockModule.execute).toHaveBeenCalledWith('get-course-program', {
        courseId: 'c-1',
      });
    });
  });
});
