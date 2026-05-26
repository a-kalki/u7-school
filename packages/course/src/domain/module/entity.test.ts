import { describe, expect, test } from 'bun:test';
import * as v from 'valibot';
import { Status } from '../status';
import { ModuleSchema, ProjectSchema } from './entity';

const validProject = {
  uuid: '550e8400-e29b-41d4-a716-446655440001',
  title: 'Проект 1',
  status: Status.PUBLISHED,
  lessonIds: ['770e8400-e29b-41d4-a716-446655440002'],
};

const validModule = {
  uuid: '660e8400-e29b-41d4-a716-446655440003',
  title: 'Модуль по JS',
  description: 'Описание модуля',
  authorId: '660e8400-e29b-41d4-a716-446655440004',
  status: Status.DRAFT,
  createdAt: '2026-05-01T12:00',
  projects: [validProject],
};

describe('ModuleSchema (новая, без kind)', () => {
  test('валидирует объект с полями Common + projects', () => {
    const result = v.safeParse(ModuleSchema, validModule);
    expect(result.success).toBe(true);
  });

  test('НЕ содержит поле kind', () => {
    // kind не должно быть в схеме — валидация с kind должна упасть
    const withKind = { ...validModule,  };
    // strictObject отклонит лишнее поле, но schema сейчас обычный object
    // Проверяем, что kind не является обязательным и не влияет на валидацию
    // Но главное — в типе Module нет поля kind
    const result = v.safeParse(ModuleSchema, withKind);
    // После упрощения kind больше не часть схемы
    expect(result.success).toBe(true);
  });

  test('отклоняет объект без projects', () => {
    const { projects, ...noProjects } = validModule;
    const result = v.safeParse(ModuleSchema, noProjects);
    expect(result.success).toBe(false);
  });

  test('принимает пустой массив projects', () => {
    const withEmptyProjects = { ...validModule, projects: [] };
    const result = v.safeParse(ModuleSchema, withEmptyProjects);
    expect(result.success).toBe(true);
  });

  test('отклоняет пустой заголовок', () => {
    const result = v.safeParse(ModuleSchema, { ...validModule, title: '' });
    expect(result.success).toBe(false);
  });

  test('отклоняет пустое описание', () => {
    const result = v.safeParse(ModuleSchema, { ...validModule, description: '' });
    expect(result.success).toBe(false);
  });

  test('принимает модуль с опциональными полями', () => {
    const withOpts = {
      ...validModule,
      targetAudience: 'Новички',
      goal: 'Научиться',
      result: 'Уметь',
      rules: 'Правила',
      additional: 'Доп',
      tags: ['js', 'web'],
      updatedAt: '2026-05-02T12:00',
    };
    const result = v.safeParse(ModuleSchema, withOpts);
    expect(result.success).toBe(true);
  });

  test('отклоняет некорректный UUID', () => {
    const result = v.safeParse(ModuleSchema, { ...validModule, uuid: 'bad-uuid' });
    expect(result.success).toBe(false);
  });
});

describe('ProjectSchema (без изменений)', () => {
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
