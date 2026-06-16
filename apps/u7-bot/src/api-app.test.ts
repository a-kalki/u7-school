import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  CourseInProcFacade,
  LessonJsonRepo,
  ModuleJsonRepo,
  StepJsonRepo,
} from '@u7-scl/course/infra';

const TEST_MODULE_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

describe('CourseInProcFacade', () => {
  let testDir: string;

  beforeAll(async () => {
    testDir = join(tmpdir(), `u7-course-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });

    // Seed-файлы курсов с тестовыми данными
    const modules = [
      {
        uuid: TEST_MODULE_ID,
        title: 'Тестовый модуль',
        description: 'Описание тестового модуля',
        authorId: '00000000-0000-4000-8000-000000000001',
        targetAudience: 'Разработчики',
        goal: 'Проверить',
        result: 'Успех',
        rules: 'Правила',
        additional: '',
        tags: ['тест'],
        status: 'published',
        projects: [
          {
            uuid: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
            title: 'Тестовый проект',
            goal: 'Цель проекта',
            result: 'Результат проекта',
            additional: '',
            status: 'published',
            lessonIds: ['bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'],
          },
        ],
        createdAt: '2026-01-01T00:00',
        updatedAt: '2026-01-01T00:00',
      },
    ];
    const lessons = [
      {
        uuid: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        moduleId: TEST_MODULE_ID,
        title: 'Тестовый урок',
        additional: '',
        status: 'published',
        createdAt: '2026-01-01T00:00',
        updatedAt: '2026-01-01T00:00',
        estimatedMinutes: 30,
        stepIds: [],
        mentorStepIds: [],
      },
    ];

    await writeFile(join(testDir, 'modules.json'), JSON.stringify(modules));
    await writeFile(join(testDir, 'lessons.json'), JSON.stringify(lessons));
    await writeFile(join(testDir, 'steps.json'), '[]');
  });

  afterAll(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  test('getModuleSnapshot возвращает непустой снапшот для существующего модуля с уроками', async () => {
    const courseRepo = new ModuleJsonRepo(join(testDir, 'modules.json'));
    const lessonRepo = new LessonJsonRepo(join(testDir, 'lessons.json'));
    const stepRepo = new StepJsonRepo(join(testDir, 'steps.json'));

    const facade = new CourseInProcFacade({
      courseRepo,
      lessonRepo,
      stepRepo,
      userFacade: {} as any,
      appResolver: { logger: console, mode: 'test' } as any,
    });

    const snapshot = await facade.getModuleSnapshot(TEST_MODULE_ID);

    expect(snapshot).toBeDefined();
    expect(snapshot.length).toBe(1);
    expect(snapshot[0].projectId).toBe(
      'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    );
    expect(snapshot[0].projectTitle).toBe('Тестовый проект');
    expect(snapshot[0].lessons.length).toBe(1);
    expect(snapshot[0].lessons[0].lessonId).toBe(
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    );
    expect(snapshot[0].lessons[0].lessonTitle).toBe('Тестовый урок');
  });

  test('getModuleSnapshot возвращает пустой массив для несуществующего модуля', async () => {
    const courseRepo = new ModuleJsonRepo(join(testDir, 'modules.json'));
    const lessonRepo = new LessonJsonRepo(join(testDir, 'lessons.json'));
    const stepRepo = new StepJsonRepo(join(testDir, 'steps.json'));

    const facade = new CourseInProcFacade({
      courseRepo,
      lessonRepo,
      stepRepo,
      userFacade: {} as any,
      appResolver: { logger: console, mode: 'test' } as any,
    });

    const snapshot = await facade.getModuleSnapshot(
      'ffffffff-ffff-4fff-8fff-ffffffffffff',
    );

    expect(snapshot).toBeDefined();
    expect(snapshot).toEqual([]);
  });
});
