import type { CourseApiModuleResolver } from '#domain/module';
import { describe, expect, mock, test } from 'bun:test';
import type { Module } from '#domain/module/entity';
import type { ModuleRepo } from '#domain/module/repo';
import { Status } from '#domain/status';
import { ListModulesUc } from './list-modules-uc';

function makeModule(overrides: Partial<Module> = {}): Module {
  return {
    uuid: crypto.randomUUID(),
    title: 'Курс',
    description: 'Описание',
    authorId: crypto.randomUUID(),
    targetAudience: undefined,
    goal: undefined,
    result: undefined,
    rules: undefined,
    additional: undefined,
    tags: [],
    status: Status.PUBLISHED,
    createdAt: '2026-05-01T12:00',
    projects: [],
    ...overrides,
  } as Module;
}

function setupUc() {
  const getAll = mock(async (): Promise<Module[]> => []);
  const repo: ModuleRepo = {
    save: mock(async () => {}),
    getByUuid: mock(async () => undefined),
    getAll,
  };
  const uc = new ListModulesUc();
  uc.init({
    courseRepo: repo,
    lessonRepo: {} as never,
    stepRepo: {} as never,
    userFacade: {} as never,
  } as unknown as CourseApiModuleResolver);
  return { getAll, uc };
}

describe('ListModulesUc', () => {
  describe('SUCCESS', () => {
    test('возвращает список PUBLISHED курсов', async () => {
      const { getAll, uc } = setupUc();
      getAll.mockResolvedValueOnce([makeModule(), makeModule()]);
      const result = await uc.handle({});
      expect(result).toHaveLength(2);
    });

    test('фильтрует DRAFT курсы без актора', async () => {
      const { getAll, uc } = setupUc();
      getAll.mockResolvedValueOnce([
        makeModule({ status: Status.PUBLISHED }),
        makeModule({ status: Status.DRAFT }),
      ]);
      const result = await uc.handle({});
      expect(result).toHaveLength(1);
      expect(result[0]?.status).toBe(Status.PUBLISHED);
    });

    test('возвращает пустой список', async () => {
      const { getAll, uc } = setupUc();
      getAll.mockResolvedValueOnce([]);
      const result = await uc.handle({});
      expect(result).toEqual([]);
    });
  });
});
