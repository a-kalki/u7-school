import { describe, expect, test } from 'bun:test';
import { presentNavLevel } from '@u7-scl/core/ui';
import { type Course, Status } from '@u7-scl/course/domain';
import {
  type ModuleNavInfo,
  resolveCourseNavLevel,
} from './course-nav-resolver';

describe('CourseNavResolver — Фаза 1: Курс и этап на общем ядре (TDD)', () => {
  const dummyCourses: Course[] = [
    {
      uuid: 'course-1',
      title: 'Fullstack JS',
      description: 'Полный курс JavaScript',
      authorId: 'author-1',
      status: Status.PUBLISHED,
      createdAt: '2026-01-01T00:00:00Z',
      phases: [
        {
          title: 'Основы JS',
          track: 'tech',
          moduleIds: ['mod-1', 'mod-2'],
        },
        {
          title: 'Продвинутый JS',
          track: 'tech',
          moduleIds: ['mod-3'],
        },
      ],
    },
    {
      uuid: 'course-2',
      title: 'Python Backend',
      description: 'Курс по Python',
      authorId: 'author-1',
      status: Status.PUBLISHED,
      createdAt: '2026-01-01T00:00:00Z',
      phases: [
        {
          title: 'Основы Python',
          moduleIds: ['mod-py-1'],
        },
      ],
    },
  ];

  const dummyModulesInfo: Record<string, ModuleNavInfo> = {
    'mod-1': {
      title: 'Введение в синтаксис',
      projectTitles: ['Переменные и типы', 'Условные операторы'],
    },
    'mod-2': {
      title: 'Структуры данных',
      projectTitles: ['Массивы', 'Объекты'],
    },
    'mod-3': {
      title: 'Асинхронный JS',
      projectTitles: ['Promise и async/await'],
    },
  };

  describe('Уровень 0: Курс', () => {
    test('хлебные крошки, пояснение и список этапов с модулями подуровнем', () => {
      const level = resolveCourseNavLevel({
        level: 'course',
        courses: dummyCourses,
        currentCourseId: 'course-1',
        modulesInfo: dummyModulesInfo,
      });

      expect(level).not.toBeNull();
      expect(level?.multilineBreadcrumbs).toBe(true);
      expect(level?.breadcrumbs).toEqual(['📖 Курсы', 'Курс: Fullstack JS']);
      expect(level?.subtitle).toBe('Курс состоит из 2 этапов');

      // Дети — этапы
      expect(level?.children).toHaveLength(2);

      const phase1 = level?.children?.[0];
      expect(phase1?.index).toBe(1);
      expect(phase1?.title).toBe('Этап: Основы JS');
      expect(phase1?.emoji).toBe('🗂️');
      expect(phase1?.enterable).toBe(true);
      expect(phase1?.address).toBe('course-catalog:phase:course-1:0');
      // Подуровень — модули
      expect(phase1?.children).toHaveLength(2);
      expect(phase1?.children?.[0]?.title).toBe('Модуль: Введение в синтаксис');
      expect(phase1?.children?.[0]?.emoji).toBe('📦');
      expect(phase1?.children?.[1]?.title).toBe('Модуль: Структуры данных');

      const phase2 = level?.children?.[1];
      expect(phase2?.index).toBe(2);
      expect(phase2?.title).toBe('Этап: Продвинутый JS');
      expect(phase2?.address).toBe('course-catalog:phase:course-1:1');
    });

    test('листание курсов: prev/next и кнопка возврата в Главное меню', () => {
      // Первый курс (нет prev, есть next)
      const level1 = resolveCourseNavLevel({
        level: 'course',
        courses: dummyCourses,
        currentCourseId: 'course-1',
        modulesInfo: dummyModulesInfo,
      });

      expect(level1?.prev).toBeUndefined();
      expect(level1?.next).toEqual({
        label: 'След. курс ▶️',
        address: 'course-catalog:course:course-2',
      });
      expect(level1?.back).toEqual({
        label: '↩️ Главное меню',
        address: 'menu:root',
      });

      // Второй курс (есть prev, нет next)
      const level2 = resolveCourseNavLevel({
        level: 'course',
        courses: dummyCourses,
        currentCourseId: 'course-2',
        modulesInfo: dummyModulesInfo,
      });

      expect(level2?.prev).toEqual({
        label: '◀️ Пред. курс',
        address: 'course-catalog:course:course-1',
      });
      expect(level2?.next).toBeUndefined();
    });

    test('wish-кнопка курса (extraRows) зависит от статуса желания', () => {
      // 1. Без желания -> Хочу пройти курс
      const levelNone = resolveCourseNavLevel({
        level: 'course',
        courses: dummyCourses,
        currentCourseId: 'course-1',
        modulesInfo: dummyModulesInfo,
      });
      expect(levelNone?.extraRows).toHaveLength(1);
      expect(levelNone?.extraRows?.[0]?.[0]?.text).toBe('🎓 Хочу пройти курс');
      expect(levelNone?.extraRows?.[0]?.[0]?.code).toBe(
        'course-catalog:apply:course-1',
      );

      // 2. pending -> Продолжить анкету
      const levelPending = resolveCourseNavLevel({
        level: 'course',
        courses: dummyCourses,
        currentCourseId: 'course-1',
        modulesInfo: dummyModulesInfo,
        wishStatus: 'pending',
      });
      expect(levelPending?.extraRows?.[0]?.[0]?.text).toBe(
        '📝 Продолжить анкету',
      );

      // 3. expressed/confirmed -> Отменить желание
      const levelExpressed = resolveCourseNavLevel({
        level: 'course',
        courses: dummyCourses,
        currentCourseId: 'course-1',
        modulesInfo: dummyModulesInfo,
        wishStatus: 'expressed',
      });
      expect(levelExpressed?.extraRows?.[0]?.[0]?.text).toBe(
        '🗑️ Отменить желание',
      );
      expect(levelExpressed?.extraRows?.[0]?.[0]?.code).toBe(
        'course-catalog:cancel:course-1',
      );
    });
  });

  describe('Уровень 1: Этап', () => {
    test('хлебные крошки, пояснение и список модулей с проектами подуровнем', () => {
      const level = resolveCourseNavLevel({
        level: 'phase',
        courses: dummyCourses,
        currentCourseId: 'course-1',
        phaseIdx: 0,
        modulesInfo: dummyModulesInfo,
      });

      expect(level).not.toBeNull();
      expect(level?.multilineBreadcrumbs).toBe(true);
      expect(level?.breadcrumbs).toEqual([
        '📖 Курсы',
        'Курс: Fullstack JS',
        'Этап: Основы JS',
      ]);
      expect(level?.subtitle).toBe('Этап состоит из 2 модулей');

      // Дети — модули
      expect(level?.children).toHaveLength(2);

      const mod1 = level?.children?.[0];
      expect(mod1?.index).toBe(1);
      expect(mod1?.title).toBe('Введение в синтаксис');
      expect(mod1?.emoji).toBe('📦');
      expect(mod1?.enterable).toBe(true);
      expect(mod1?.address).toBe('course-catalog:module:course-1:0:mod-1');

      // Подуровень модуля — проекты
      expect(mod1?.children).toHaveLength(2);
      expect(mod1?.children?.[0]?.title).toBe('Проект: Переменные и типы');
      expect(mod1?.children?.[0]?.emoji).toBe('📁');
      expect(mod1?.children?.[1]?.title).toBe('Проект: Условные операторы');

      // Назад к курсу
      expect(level?.back).toEqual({
        label: '⬅️ Назад к курсу',
        address: 'course-catalog:course:course-1',
      });
    });

    test('листание этапов в пределах курса', () => {
      // Первый этап (нет prev, есть next)
      const level0 = resolveCourseNavLevel({
        level: 'phase',
        courses: dummyCourses,
        currentCourseId: 'course-1',
        phaseIdx: 0,
        modulesInfo: dummyModulesInfo,
      });
      expect(level0?.prev).toBeUndefined();
      expect(level0?.next).toEqual({
        label: 'След. этап ▶️',
        address: 'course-catalog:phase:course-1:1',
      });

      // Второй этап (есть prev, нет next)
      const level1 = resolveCourseNavLevel({
        level: 'phase',
        courses: dummyCourses,
        currentCourseId: 'course-1',
        phaseIdx: 1,
        modulesInfo: dummyModulesInfo,
      });
      expect(level1?.prev).toEqual({
        label: '◀️ Пред. этап',
        address: 'course-catalog:phase:course-1:0',
      });
      expect(level1?.next).toBeUndefined();
    });
  });

  describe('Подключение presenter: рендеринг карточек курса и этапа', () => {
    test('presentNavLevel корректно рендерит текст и клавиатуру уровня курса', () => {
      const level = resolveCourseNavLevel({
        level: 'course',
        courses: dummyCourses,
        currentCourseId: 'course-1',
        modulesInfo: dummyModulesInfo,
      });
      expect(level).not.toBeNull();
      if (!level) return;

      const { text, keyboard } = presentNavLevel(level);

      // MarkdownV2 текст
      expect(text).toContain('📖 *Курсы*\n› Курс: Fullstack JS');
      expect(text).toContain('Курс состоит из 2 этапов');
      expect(text).toContain('1\\. *Этап: Основы JS*');
      expect(text).toContain('    📦 Модуль: Введение в синтаксис');
      expect(text).toContain('2\\. *Этап: Продвинутый JS*');

      // Клавиатура: 2 кнопки этапов, 1 wish, 1 навигация (След. курс), 1 меню
      expect(keyboard.rows).toHaveLength(5);
      expect(keyboard.rows[0]?.[0]?.text).toContain('1. 🗂️ Этап: Основы JS');
      expect(keyboard.rows[0]?.[0]?.code).toBe(
        'course-catalog:phase:course-1:0',
      );
      expect(keyboard.rows[1]?.[0]?.text).toContain(
        '2. 🗂️ Этап: Продвинутый JS',
      );
      expect(keyboard.rows[2]?.[0]?.text).toBe('🎓 Хочу пройти курс');
      expect(keyboard.rows[3]?.[0]?.text).toBe('След. курс ▶️');
      expect(keyboard.rows[4]?.[0]?.text).toBe('↩️ Главное меню');
    });

    test('presentNavLevel корректно рендерит текст и клавиатуру уровня этапа', () => {
      const level = resolveCourseNavLevel({
        level: 'phase',
        courses: dummyCourses,
        currentCourseId: 'course-1',
        phaseIdx: 0,
        modulesInfo: dummyModulesInfo,
      });
      expect(level).not.toBeNull();
      if (!level) return;

      const { text, keyboard } = presentNavLevel(level);

      expect(text).toContain(
        '📖 *Курсы*\n› Курс: Fullstack JS\n› Этап: Основы JS',
      );
      expect(text).toContain('Этап состоит из 2 модулей');
      expect(text).toContain('1\\. *Введение в синтаксис*');
      expect(text).toContain('    📁 Проект: Переменные и типы');

      // Клавиатура: 2 кнопки модулей, 1 навигация (След. этап), 1 назад к курсу
      expect(keyboard.rows).toHaveLength(4);
      expect(keyboard.rows[0]?.[0]?.text).toContain(
        '1. 📦 Введение в синтаксис',
      );
      expect(keyboard.rows[0]?.[0]?.code).toBe(
        'course-catalog:module:course-1:0:mod-1',
      );
      expect(keyboard.rows[1]?.[0]?.text).toContain('2. 📦 Структуры данных');
      expect(keyboard.rows[2]?.[0]?.text).toBe('След. этап ▶️');
      expect(keyboard.rows[3]?.[0]?.text).toBe('⬅️ Назад к курсу');
    });
  });
});
