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
});
