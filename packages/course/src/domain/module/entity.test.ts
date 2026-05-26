import { describe, expect, test } from 'bun:test';
import * as v from 'valibot';
import { Status } from '../status';
import { CourseSchema, ModuleSchema, ProjectSchema } from './entity';

const validModule = {
  uuid: '550e8400-e29b-41d4-a716-446655440000',
  title: 'Модуль 1',
  status: Status.DRAFT,
  projects: [],
};

const validProject = {
  uuid: '550e8400-e29b-41d4-a716-446655440001',
  title: 'Проект 1',
  status: Status.PUBLISHED,
  lessonIds: ['770e8400-e29b-41d4-a716-446655440002'],
};

const validModulesCourse = {
  uuid: '660e8400-e29b-41d4-a716-446655440003',
  kind: 'modules' as const,
  title: 'Курс по JS',
  description: 'Описание',
  authorId: '660e8400-e29b-41d4-a716-446655440004',
  status: Status.DRAFT,
  createdAt: '2026-05-01T12:00',
  modules: [{ ...validModule, projects: [] }],
};

const validProjectsCourse = {
  uuid: '660e8400-e29b-41d4-a716-446655440005',
  kind: 'projects' as const,
  title: 'Курс по Python',
  description: 'Описание',
  authorId: '660e8400-e29b-41d4-a716-446655440006',
  status: Status.PUBLISHED,
  createdAt: '2026-05-01T12:00',
  projects: [validProject],
};

describe('ModuleSchema', () => {
  test('принимает валидный модуль', () => {
    const result = v.safeParse(ModuleSchema, validModule);
    expect(result.success).toBe(true);
  });

  test('принимает модуль с проектами', () => {
    const withProjects = {
      ...validModule,
      projects: [validProject],
    };
    const result = v.safeParse(ModuleSchema, withProjects);
    expect(result.success).toBe(true);
  });

  test('отклоняет пустой заголовок', () => {
    const result = v.safeParse(ModuleSchema, { ...validModule, title: '' });
    expect(result.success).toBe(false);
  });
});

describe('ProjectSchema', () => {
  test('принимает валидный проект', () => {
    const result = v.safeParse(ProjectSchema, validProject);
    expect(result.success).toBe(true);
  });

  test('принимает проект с пустым lessonIds', () => {
    const result = v.safeParse(ProjectSchema, {
      ...validProject,
      lessonIds: [],
    });
    expect(result.success).toBe(true);
  });
});

describe('CourseSchema', () => {
  test('принимает курс с modules', () => {
    const result = v.safeParse(CourseSchema, validModulesCourse);
    expect(result.success).toBe(true);
  });

  test('принимает курс с projects', () => {
    const result = v.safeParse(CourseSchema, validProjectsCourse);
    expect(result.success).toBe(true);
  });

  test('принимает курс с опциональными полями', () => {
    const withOpts = {
      ...validModulesCourse,
      targetAudience: 'Новички',
      goal: 'Научиться',
      result: 'Уметь',
      rules: 'Правила',
      additional: 'Доп',
      tags: ['js', 'web'],
      updatedAt: '2026-05-02T12:00',
    };
    const result = v.safeParse(CourseSchema, withOpts);
    expect(result.success).toBe(true);
  });

  test('отклоняет курс без modules для kind=modules', () => {
    const { modules, ...noModules } = validModulesCourse;
    const result = v.safeParse(CourseSchema, noModules);
    expect(result.success).toBe(false);
  });

  test('отклоняет курс без projects для kind=projects', () => {
    const { projects, ...noProjects } = validProjectsCourse;
    const result = v.safeParse(CourseSchema, noProjects);
    expect(result.success).toBe(false);
  });

  test('отклоняет пустой заголовок', () => {
    const result = v.safeParse(CourseSchema, {
      ...validModulesCourse,
      title: '',
    });
    expect(result.success).toBe(false);
  });

  test('отклоняет пустое описание', () => {
    const result = v.safeParse(CourseSchema, {
      ...validModulesCourse,
      description: '',
    });
    expect(result.success).toBe(false);
  });
});
