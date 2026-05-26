import { describe, expect, test } from 'bun:test';
import { Status } from '../status';
import { ModuleAr } from './a-root';

const authorId = crypto.randomUUID();

const enrichCmd = {
  moduleId: 'unused',
  targetAudience: 'Новички',
  goal: 'Научиться',
  result: 'Уметь',
  rules: 'Правила',
  additional: 'Дополнительно',
  tags: ['js', 'web'],
};

const projectCmd = {
  moduleId: 'unused',
  title: 'Проект 1',
  goal: undefined,
  result: undefined,
  additional: undefined,
};

describe('ModuleAr', () => {
  describe('create', () => {
    test('создаёт модуль с projects: []', () => {
      const ar = ModuleAr.create('Модуль JS', 'Описание модуля', authorId);
      expect(ar.state.title).toBe('Модуль JS');
      expect(ar.state.authorId).toBe(authorId);
      expect(ar.state.status).toBe(Status.DRAFT);
      expect(ar.state.projects).toEqual([]);
      expect(ar.state.uuid).toMatch(
        /^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$/i,
      );
    });

    test('НЕ принимает kind', () => {
      // create() больше не имеет параметра kind
      const ar = ModuleAr.create('Модуль', 'Описание', authorId);
      // kind отсутствует в состоянии
      expect((ar.state as Record<string, unknown>).kind).toBeUndefined();
    });

    test('генерирует UUID и createdAt', () => {
      const ar = ModuleAr.create('Модуль', 'Описание', authorId);
      expect(ar.state.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    });

    test('не создаёт updatedAt при создании', () => {
      const ar = ModuleAr.create('Модуль', 'Описание', authorId);
      expect(ar.state.updatedAt).toBeUndefined();
    });

    test('опциональные поля undefined по умолчанию', () => {
      const ar = ModuleAr.create('Модуль', 'Описание', authorId);
      expect(ar.state.targetAudience).toBeUndefined();
      expect(ar.state.goal).toBeUndefined();
      expect(ar.state.tags).toEqual([]);
    });
  });

  describe('enrich', () => {
    test('устанавливает дополнительные поля', () => {
      const ar = ModuleAr.create('Модуль', 'Описание', authorId);
      ar.enrich(enrichCmd);

      expect(ar.state.targetAudience).toBe('Новички');
      expect(ar.state.goal).toBe('Научиться');
      expect(ar.state.result).toBe('Уметь');
      expect(ar.state.rules).toBe('Правила');
      expect(ar.state.additional).toBe('Дополнительно');
      expect(ar.state.tags).toEqual(['js', 'web']);
      expect(ar.state.updatedAt).toBeDefined();
    });

    test('не трогает projects при enrich', () => {
      const ar = ModuleAr.create('Модуль', 'Описание', authorId);
      ar.enrich(enrichCmd);
      expect(ar.state.projects).toEqual([]);
    });
  });

  describe('addProject', () => {
    test('добавляет проект в корневые проекты', () => {
      const ar = ModuleAr.create('Модуль', 'Описание', authorId);
      ar.addProject(projectCmd);

      expect(ar.state.projects).toHaveLength(1);
      expect(ar.state.projects[0]?.title).toBe('Проект 1');
      expect(ar.state.projects[0]?.status).toBe(Status.DRAFT);
      expect(ar.state.updatedAt).toBeDefined();
    });

    test('добавляет несколько проектов', () => {
      const ar = ModuleAr.create('Модуль', 'Описание', authorId);
      ar.addProject(projectCmd);
      ar.addProject({ ...projectCmd, title: 'Проект 2' });

      expect(ar.state.projects).toHaveLength(2);
      expect(ar.state.projects[1]?.title).toBe('Проект 2');
    });
  });

  describe('getProject', () => {
    test('ищет только в корневых проектах', () => {
      const ar = ModuleAr.create('Модуль', 'Описание', authorId);
      ar.addProject(projectCmd);
      const pid = ar.state.projects[0]?.uuid as string;

      const found = ar.getProject(pid);
      expect(found?.title).toBe('Проект 1');
    });

    test('возвращает undefined если проект не найден', () => {
      const ar = ModuleAr.create('Модуль', 'Описание', authorId);
      expect(ar.getProject(crypto.randomUUID())).toBeUndefined();
    });
  });

  describe('publish', () => {
    test('меняет статус на PUBLISHED', () => {
      const ar = ModuleAr.create('Модуль', 'Описание', authorId);
      expect(ar.state.status).toBe(Status.DRAFT);

      ar.publish();
      expect(ar.state.status).toBe(Status.PUBLISHED);
      expect(ar.state.updatedAt).toBeDefined();
    });
  });

  describe('publishProject', () => {
    test('публикует проект в корневых проектах', () => {
      const ar = ModuleAr.create('Модуль', 'Описание', authorId);
      ar.addProject(projectCmd);
      const pid = ar.state.projects[0]?.uuid as string;

      ar.publishProject(pid);
      expect(ar.state.projects[0]?.status).toBe(Status.PUBLISHED);
    });

    test('выбрасывает ошибку если проект не найден', () => {
      const ar = ModuleAr.create('Модуль', 'Описание', authorId);
      expect(() => ar.publishProject(crypto.randomUUID())).toThrow(
        'Проект не найден в модуле',
      );
    });
  });

  describe('addLessonToProject', () => {
    test('добавляет lessonId в проект', () => {
      const ar = ModuleAr.create('Модуль', 'Описание', authorId);
      ar.addProject(projectCmd);
      const pid = ar.state.projects[0]?.uuid as string;
      const lessonId = crypto.randomUUID();

      ar.addLessonToProject(pid, lessonId);
      expect(ar.state.projects[0]?.lessonIds).toContain(lessonId);
    });
  });

  describe('getLessons', () => {
    test('возвращает lessonIds проекта', () => {
      const ar = ModuleAr.create('Модуль', 'Описание', authorId);
      ar.addProject(projectCmd);
      const pid = ar.state.projects[0]?.uuid as string;
      const lessonId = crypto.randomUUID();
      ar.addLessonToProject(pid, lessonId);

      const lessons = ar.getLessons(pid);
      expect(lessons).toEqual([lessonId]);
    });
  });

  describe('getVisibleFor', () => {
    test('фильтрует только корневые проекты', () => {
      const ar = ModuleAr.create('Модуль', 'Описание', authorId);
      ar.addProject(projectCmd);
      const pid = ar.state.projects[0]?.uuid as string;
      ar.publishProject(pid);

      // Добавляем ещё один неопубликованный проект
      ar.addProject({ ...projectCmd, title: 'Черновик' });

      // Автор видит только опубликованные проекты (через getVisibleFor)
      ar.publish();
      const visible = ar.getVisibleFor();
      expect(visible?.projects).toHaveLength(1);
      expect(visible?.projects[0]?.title).toBe('Проект 1');
    });
  });

  describe('полный жизненный цикл', () => {
    test('create → enrich → addProject → publish', () => {
      const ar = ModuleAr.create('Модуль', 'Описание', authorId);
      ar.enrich(enrichCmd);
      ar.addProject(projectCmd);
      ar.publish();

      expect(ar.state.title).toBe('Модуль');
      expect(ar.state.targetAudience).toBe('Новички');
      expect(ar.state.projects).toHaveLength(1);
      expect(ar.state.status).toBe(Status.PUBLISHED);
    });
  });
});
