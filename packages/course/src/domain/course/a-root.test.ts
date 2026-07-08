import { describe, expect, it } from 'bun:test';
import { Status } from '../status';
import { CourseAr } from './a-root';

describe('CourseAr', () => {
  const authorId = crypto.randomUUID();

  describe('create()', () => {
    it('создаёт курс в статусе draft', () => {
      const course = CourseAr.create(
        'Основы JavaScript',
        'Изучаем синтаксис языка JavaScript',
        authorId,
      );

      expect(course.state.title).toBe('Основы JavaScript');
      expect(course.state.description).toBe(
        'Изучаем синтаксис языка JavaScript',
      );
      expect(course.state.authorId).toBe(authorId);
      expect(course.state.status).toBe(Status.DRAFT);
      expect(course.state.phases).toEqual([]);
      expect(course.state.uuid).toBeTypeOf('string');
      expect(course.state.createdAt).toBeTypeOf('string');
    });

    it('выбрасывает ошибку при пустом заголовке', () => {
      expect(() => CourseAr.create('', 'Описание', authorId)).toThrow();
    });

    it('выбрасывает ошибку при пустом описании', () => {
      expect(() => CourseAr.create('Заголовок', '', authorId)).toThrow();
    });
  });

  describe('addPhase()', () => {
    it('добавляет фазу с track', () => {
      const course = CourseAr.create('Курс', 'Описание', authorId);
      course.addPhase('Этап 1: Основы JS', 'tech');

      const phase = course.state.phases[0]!;
      expect(course.state.phases).toHaveLength(1);
      expect(phase.title).toBe('Этап 1: Основы JS');
      expect(phase.track).toBe('tech');
      expect(phase.moduleIds).toEqual([]);
    });

    it('добавляет фазу без track', () => {
      const course = CourseAr.create('Курс', 'Описание', authorId);
      course.addPhase('Общий этап');

      expect(course.state.phases[0]!.track).toBeUndefined();
    });

    it('добавляет несколько фаз', () => {
      const course = CourseAr.create('Курс', 'Описание', authorId);
      course.addPhase('Фаза 1');
      course.addPhase('Фаза 2');

      expect(course.state.phases).toHaveLength(2);
      expect(course.state.phases[0]!.title).toBe('Фаза 1');
      expect(course.state.phases[1]!.title).toBe('Фаза 2');
    });

    it('выбрасывает ошибку при дублировании title', () => {
      const course = CourseAr.create('Курс', 'Описание', authorId);
      course.addPhase('Этап 1');

      expect(() => course.addPhase('Этап 1')).toThrow(
        'Фаза с таким названием уже существует',
      );
    });
  });

  describe('addModuleToPhase()', () => {
    it('добавляет moduleId в фазу по названию', () => {
      const course = CourseAr.create('Курс', 'Описание', authorId);
      course.addPhase('Этап 1', 'tech');
      const moduleId = crypto.randomUUID();

      course.addModuleToPhase('Этап 1', moduleId);

      expect(course.state.phases[0]!.moduleIds).toContain(moduleId);
    });

    it('выбрасывает ошибку если фаза не найдена', () => {
      const course = CourseAr.create('Курс', 'Описание', authorId);

      expect(() =>
        course.addModuleToPhase('Несуществующая', crypto.randomUUID()),
      ).toThrow('Фаза не найдена');
    });

    it('позволяет добавить несколько модулей в фазу', () => {
      const course = CourseAr.create('Курс', 'Описание', authorId);
      course.addPhase('Этап 1');
      const moduleId1 = crypto.randomUUID();
      const moduleId2 = crypto.randomUUID();

      course.addModuleToPhase('Этап 1', moduleId1);
      course.addModuleToPhase('Этап 1', moduleId2);

      expect(course.state.phases[0]!.moduleIds).toEqual([moduleId1, moduleId2]);
    });
  });

  describe('инварианты', () => {
    it('конструктор выбрасывает ошибку при дублировании названий фаз', () => {
      expect(
        () =>
          new CourseAr({
            uuid: crypto.randomUUID(),
            title: 'Курс',
            description: 'Описание',
            authorId,
            phases: [
              { title: 'Этап 1', moduleIds: [] },
              { title: 'Этап 1', moduleIds: [] },
            ],
            status: Status.DRAFT,
            createdAt: '2026-07-08T16:00',
          }),
      ).toThrow('Названия фаз должны быть уникальны');
    });

    it('конструктор принимает фазы с разными названиями', () => {
      const course = new CourseAr({
        uuid: crypto.randomUUID(),
        title: 'Курс',
        description: 'Описание',
        authorId,
        phases: [
          { title: 'Этап 1', moduleIds: [] },
          { title: 'Этап 2', moduleIds: [] },
        ],
        status: Status.DRAFT,
        createdAt: '2026-07-08T16:00',
      });

      expect(course.state.phases).toHaveLength(2);
    });
  });

  describe('publish()', () => {
    it('меняет статус на published', () => {
      const course = CourseAr.create('Курс', 'Описание', authorId);
      course.publish();

      expect(course.state.status).toBe(Status.PUBLISHED);
    });

    it('повторный publish выбрасывает ошибку', () => {
      const course = CourseAr.create('Курс', 'Описание', authorId);
      course.publish();

      expect(() => course.publish()).toThrow();
    });
  });
});
