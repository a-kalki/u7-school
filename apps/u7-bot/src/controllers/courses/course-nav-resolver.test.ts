import { describe, expect, test } from 'bun:test';
import { presentNavLevel } from '@u7-scl/core/ui';
import {
  type ContentSnapshot,
  type Course,
  Status,
} from '@u7-scl/course/domain';
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

      const levelConfirmed = resolveCourseNavLevel({
        level: 'course',
        courses: dummyCourses,
        currentCourseId: 'course-1',
        modulesInfo: dummyModulesInfo,
        wishStatus: 'confirmed',
      });
      expect(levelConfirmed?.extraRows?.[0]?.[0]?.text).toBe(
        '🗑️ Отменить желание',
      );
      expect(levelConfirmed?.extraRows?.[0]?.[0]?.code).toBe(
        'course-catalog:cancel:course-1',
      );

      // 4. fulfilled (обучение) -> Хочу пройти курс (клик ведет на W04)
      const levelFulfilled = resolveCourseNavLevel({
        level: 'course',
        courses: dummyCourses,
        currentCourseId: 'course-1',
        modulesInfo: dummyModulesInfo,
        wishStatus: 'fulfilled',
      });
      expect(levelFulfilled?.extraRows?.[0]?.[0]?.text).toBe(
        '🎓 Хочу пройти курс',
      );
      expect(levelFulfilled?.extraRows?.[0]?.[0]?.code).toBe(
        'course-catalog:apply:course-1',
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
    test('presentNavLevel корректно рендерит клавиатуру с разными wish-кнопками', () => {
      // pending -> кнопка продолжить анкету
      const levelPending = resolveCourseNavLevel({
        level: 'course',
        courses: dummyCourses,
        currentCourseId: 'course-1',
        modulesInfo: dummyModulesInfo,
        wishStatus: 'pending',
      });
      const kbPending = presentNavLevel(levelPending!).keyboard;
      expect(kbPending.rows[2]?.[0]?.text).toBe('📝 Продолжить анкету');
      expect(kbPending.rows[2]?.[0]?.code).toBe(
        'questionnaire:fill:resume:course-1',
      );

      // confirmed -> кнопка отменить желание
      const levelConfirmed = resolveCourseNavLevel({
        level: 'course',
        courses: dummyCourses,
        currentCourseId: 'course-1',
        modulesInfo: dummyModulesInfo,
        wishStatus: 'confirmed',
      });
      const kbConfirmed = presentNavLevel(levelConfirmed!).keyboard;
      expect(kbConfirmed.rows[2]?.[0]?.text).toBe('🗑️ Отменить желание');
      expect(kbConfirmed.rows[2]?.[0]?.code).toBe(
        'course-catalog:cancel:course-1',
      );
    });

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

  describe('Фаза 2: Уровни Модуль и Проект (TDD)', () => {
    const dummySnapshot: ContentSnapshot = [
      {
        projectId: 'proj-1',
        projectTitle: 'Введение в JS',
        lessons: [
          {
            lessonId: 'les-1',
            lessonTitle: 'Настройка окружения',
            stepIds: ['step-1-1', 'step-1-2'],
          },
          {
            lessonId: 'les-2',
            lessonTitle: 'Первая программа',
            stepIds: ['step-2-1'],
          },
        ],
      },
      {
        projectId: 'proj-2',
        projectTitle: 'Базовые типы и операторы',
        lessons: [
          {
            lessonId: 'les-3',
            lessonTitle: 'Числа и строки',
            stepIds: ['step-3-1'],
          },
        ],
      },
    ];

    const dummyStepTitles: Record<string, string> = {
      'step-1-1': 'Установка Bun',
      'step-1-2': 'Запуск скрипта',
      'step-2-1': 'Hello World',
      'step-3-1': 'Примитивные типы',
    };

    describe('Уровень 2: Модуль', () => {
      test('хлебные крошки, пояснение и список проектов с уроками подуровнем', () => {
        const level = resolveCourseNavLevel({
          level: 'module',
          courses: dummyCourses,
          currentCourseId: 'course-1',
          phaseIdx: 0,
          moduleId: 'mod-1',
          modulesInfo: dummyModulesInfo,
          moduleSnapshot: dummySnapshot,
        });

        expect(level).not.toBeNull();
        expect(level?.multilineBreadcrumbs).toBe(true);
        expect(level?.breadcrumbs).toEqual([
          '📖 Курсы',
          'Курс: Fullstack JS',
          'Этап: Основы JS',
          'Модуль: Введение в синтаксис',
        ]);
        expect(level?.subtitle).toBe('Модуль состоит из 2 проектов');

        // Дети — проекты
        expect(level?.children).toHaveLength(2);

        const proj1 = level?.children?.[0];
        expect(proj1?.index).toBe(1);
        expect(proj1?.title).toBe('Введение в JS');
        expect(proj1?.emoji).toBe('📁');
        expect(proj1?.enterable).toBe(true);
        expect(proj1?.address).toBe(
          'course-catalog:project:course-1:0:mod-1:proj-1',
        );

        // Подуровень проекта — уроки
        expect(proj1?.children).toHaveLength(2);
        expect(proj1?.children?.[0]?.title).toBe('Настройка окружения');
        expect(proj1?.children?.[0]?.emoji).toBe('📝');
        expect(proj1?.children?.[1]?.title).toBe('Первая программа');
        expect(proj1?.children?.[1]?.emoji).toBe('📝');

        // Назад к этапу
        expect(level?.back).toEqual({
          label: '⬅️ Назад к этапу',
          address: 'course-catalog:phase:course-1:0',
        });
      });

      test('листание модулей в пределах этапа', () => {
        // Первый модуль mod-1 (нет prev, есть next: mod-2)
        const level1 = resolveCourseNavLevel({
          level: 'module',
          courses: dummyCourses,
          currentCourseId: 'course-1',
          phaseIdx: 0,
          moduleId: 'mod-1',
          modulesInfo: dummyModulesInfo,
          moduleSnapshot: dummySnapshot,
        });
        expect(level1?.prev).toBeUndefined();
        expect(level1?.next).toEqual({
          label: 'След. модуль ▶️',
          address: 'course-catalog:module:course-1:0:mod-2',
        });

        // Второй модуль mod-2 (есть prev: mod-1, нет next)
        const level2 = resolveCourseNavLevel({
          level: 'module',
          courses: dummyCourses,
          currentCourseId: 'course-1',
          phaseIdx: 0,
          moduleId: 'mod-2',
          modulesInfo: dummyModulesInfo,
          moduleSnapshot: dummySnapshot,
        });
        expect(level2?.prev).toEqual({
          label: '◀️ Пред. модуль',
          address: 'course-catalog:module:course-1:0:mod-1',
        });
        expect(level2?.next).toBeUndefined();
      });
    });

    describe('Уровень 3: Проект', () => {
      test('хлебные крошки, пояснение и список уроков с шагами-заголовками подуровнем', () => {
        const level = resolveCourseNavLevel({
          level: 'project',
          courses: dummyCourses,
          currentCourseId: 'course-1',
          phaseIdx: 0,
          moduleId: 'mod-1',
          projectId: 'proj-1',
          modulesInfo: dummyModulesInfo,
          moduleSnapshot: dummySnapshot,
          stepTitles: dummyStepTitles,
        });

        expect(level).not.toBeNull();
        expect(level?.multilineBreadcrumbs).toBe(true);
        expect(level?.breadcrumbs).toEqual([
          '📖 Курсы',
          'Курс: Fullstack JS',
          'Этап: Основы JS',
          'Модуль: Введение в синтаксис',
          'Проект: Введение в JS',
        ]);
        expect(level?.subtitle).toBe('Проект состоит из 2 уроков');

        // Дети — уроки
        expect(level?.children).toHaveLength(2);

        const les1 = level?.children?.[0];
        expect(les1?.index).toBe(1);
        expect(les1?.title).toBe('Настройка окружения');
        expect(les1?.emoji).toBe('📝');
        expect(les1?.enterable).toBe(true);
        expect(les1?.address).toBe(
          'course-catalog:lesson:course-1:0:mod-1:proj-1:les-1',
        );

        // Подуровень урока — шаги-заголовки
        expect(les1?.children).toHaveLength(2);
        expect(les1?.children?.[0]?.title).toBe('Установка Bun');
        expect(les1?.children?.[0]?.emoji).toBe('🔹');
        expect(les1?.children?.[1]?.title).toBe('Запуск скрипта');
        expect(les1?.children?.[1]?.emoji).toBe('🔹');

        // Назад к модулю
        expect(level?.back).toEqual({
          label: '⬅️ Назад к модулю',
          address: 'course-catalog:module:course-1:0:mod-1',
        });
      });

      test('листание проектов в пределах модуля', () => {
        // Первый проект proj-1 (нет prev, есть next: proj-2)
        const level1 = resolveCourseNavLevel({
          level: 'project',
          courses: dummyCourses,
          currentCourseId: 'course-1',
          phaseIdx: 0,
          moduleId: 'mod-1',
          projectId: 'proj-1',
          modulesInfo: dummyModulesInfo,
          moduleSnapshot: dummySnapshot,
          stepTitles: dummyStepTitles,
        });
        expect(level1?.prev).toBeUndefined();
        expect(level1?.next).toEqual({
          label: 'След. проект ▶️',
          address: 'course-catalog:project:course-1:0:mod-1:proj-2',
        });

        // Второй проект proj-2 (есть prev: proj-1, нет next)
        const level2 = resolveCourseNavLevel({
          level: 'project',
          courses: dummyCourses,
          currentCourseId: 'course-1',
          phaseIdx: 0,
          moduleId: 'mod-1',
          projectId: 'proj-2',
          modulesInfo: dummyModulesInfo,
          moduleSnapshot: dummySnapshot,
          stepTitles: dummyStepTitles,
        });
        expect(level2?.prev).toEqual({
          label: '◀️ Пред. проект',
          address: 'course-catalog:project:course-1:0:mod-1:proj-1',
        });
        expect(level2?.next).toBeUndefined();
      });
    });

    describe('Подключение presenter: рендеринг карточек модуля и проекта', () => {
      test('presentNavLevel корректно рендерит текст и клавиатуру уровня модуля', () => {
        const level = resolveCourseNavLevel({
          level: 'module',
          courses: dummyCourses,
          currentCourseId: 'course-1',
          phaseIdx: 0,
          moduleId: 'mod-1',
          modulesInfo: dummyModulesInfo,
          moduleSnapshot: dummySnapshot,
        });
        expect(level).not.toBeNull();
        if (!level) return;

        const { text, keyboard } = presentNavLevel(level);

        expect(text).toContain(
          '📖 *Курсы*\n› Курс: Fullstack JS\n› Этап: Основы JS\n› Модуль: Введение в синтаксис',
        );
        expect(text).toContain('Модуль состоит из 2 проектов');
        expect(text).toContain('1\\. *Введение в JS*');
        expect(text).toContain('    📝 Настройка окружения');

        // Клавиатура: 2 кнопки проектов, 1 навигация (След. модуль), 1 назад к этапу
        expect(keyboard.rows).toHaveLength(4);
        expect(keyboard.rows[0]?.[0]?.text).toContain('1. 📁 Введение в JS');
        expect(keyboard.rows[0]?.[0]?.code).toBe(
          'course-catalog:project:course-1:0:mod-1:proj-1',
        );
        expect(keyboard.rows[1]?.[0]?.text).toContain(
          '2. 📁 Базовые типы и операторы',
        );
        expect(keyboard.rows[2]?.[0]?.text).toBe('След. модуль ▶️');
        expect(keyboard.rows[3]?.[0]?.text).toBe('⬅️ Назад к этапу');
      });

      test('presentNavLevel корректно рендерит текст и клавиатуру уровня проекта', () => {
        const level = resolveCourseNavLevel({
          level: 'project',
          courses: dummyCourses,
          currentCourseId: 'course-1',
          phaseIdx: 0,
          moduleId: 'mod-1',
          projectId: 'proj-1',
          modulesInfo: dummyModulesInfo,
          moduleSnapshot: dummySnapshot,
          stepTitles: dummyStepTitles,
        });
        expect(level).not.toBeNull();
        if (!level) return;

        const { text, keyboard } = presentNavLevel(level);

        expect(text).toContain(
          '📖 *Курсы*\n› Курс: Fullstack JS\n› Этап: Основы JS\n› Модуль: Введение в синтаксис\n› Проект: Введение в JS',
        );
        expect(text).toContain('Проект состоит из 2 уроков');
        expect(text).toContain('1\\. *Настройка окружения*');
        expect(text).toContain('    🔹 Установка Bun');

        // Клавиатура: 2 кнопки уроков, 1 навигация (След. проект), 1 назад к модулю
        expect(keyboard.rows).toHaveLength(4);
        expect(keyboard.rows[0]?.[0]?.text).toContain(
          '1. 📝 Настройка окружения',
        );
        expect(keyboard.rows[0]?.[0]?.code).toBe(
          'course-catalog:lesson:course-1:0:mod-1:proj-1:les-1',
        );
        expect(keyboard.rows[1]?.[0]?.text).toContain('2. 📝 Первая программа');
        expect(keyboard.rows[2]?.[0]?.text).toBe('След. проект ▶️');
        expect(keyboard.rows[3]?.[0]?.text).toBe('⬅️ Назад к модулю');
      });
    });

    describe('Уровень 4: Урок (шаги только заголовками, закрытый уровень)', () => {
      test('хлебные крошки, пояснение и одноуровневый список шагов без входа', () => {
        const level = resolveCourseNavLevel({
          level: 'lesson',
          courses: dummyCourses,
          currentCourseId: 'course-1',
          phaseIdx: 0,
          moduleId: 'mod-1',
          projectId: 'proj-1',
          lessonId: 'les-1',
          modulesInfo: dummyModulesInfo,
          moduleSnapshot: dummySnapshot,
          stepTitles: dummyStepTitles,
        });

        expect(level).not.toBeNull();
        expect(level?.multilineBreadcrumbs).toBe(true);
        expect(level?.breadcrumbs).toEqual([
          '📖 Курсы',
          'Курс: Fullstack JS',
          'Этап: Основы JS',
          'Модуль: Введение в синтаксис',
          'Проект: Введение в JS',
          'Урок: Настройка окружения',
        ]);
        expect(level?.subtitle).toBe('Урок состоит из 2 шагов');

        // Дети — шаги
        expect(level?.children).toHaveLength(2);

        const step1 = level?.children?.[0];
        expect(step1?.index).toBe(1);
        expect(step1?.title).toBe('Установка Bun');
        expect(step1?.emoji).toBe('🔹');
        expect(step1?.enterable).toBe(false);
        expect(step1?.address).toBeUndefined();
        expect(step1?.children).toBeUndefined();

        const step2 = level?.children?.[1];
        expect(step2?.index).toBe(2);
        expect(step2?.title).toBe('Запуск скрипта');
        expect(step2?.emoji).toBe('🔹');
        expect(step2?.enterable).toBe(false);
        expect(step2?.address).toBeUndefined();

        // Назад к проекту
        expect(level?.back).toEqual({
          label: '⬅️ Назад к проекту',
          address: 'course-catalog:project:course-1:0:mod-1:proj-1',
        });
      });

      test('листание уроков в пределах проекта', () => {
        // Первый урок les-1 (нет prev, есть next: les-2)
        const level1 = resolveCourseNavLevel({
          level: 'lesson',
          courses: dummyCourses,
          currentCourseId: 'course-1',
          phaseIdx: 0,
          moduleId: 'mod-1',
          projectId: 'proj-1',
          lessonId: 'les-1',
          modulesInfo: dummyModulesInfo,
          moduleSnapshot: dummySnapshot,
          stepTitles: dummyStepTitles,
        });
        expect(level1?.prev).toBeUndefined();
        expect(level1?.next).toEqual({
          label: 'След. урок ▶️',
          address: 'course-catalog:lesson:course-1:0:mod-1:proj-1:les-2',
        });

        // Второй урок les-2 (есть prev: les-1, нет next)
        const level2 = resolveCourseNavLevel({
          level: 'lesson',
          courses: dummyCourses,
          currentCourseId: 'course-1',
          phaseIdx: 0,
          moduleId: 'mod-1',
          projectId: 'proj-1',
          lessonId: 'les-2',
          modulesInfo: dummyModulesInfo,
          moduleSnapshot: dummySnapshot,
          stepTitles: dummyStepTitles,
        });
        expect(level2?.prev).toEqual({
          label: '◀️ Пред. урок',
          address: 'course-catalog:lesson:course-1:0:mod-1:proj-1:les-1',
        });
        expect(level2?.next).toBeUndefined();
      });

      test('presentNavLevel корректно рендерит карточку урока без кнопок шагов', () => {
        const level = resolveCourseNavLevel({
          level: 'lesson',
          courses: dummyCourses,
          currentCourseId: 'course-1',
          phaseIdx: 0,
          moduleId: 'mod-1',
          projectId: 'proj-1',
          lessonId: 'les-1',
          modulesInfo: dummyModulesInfo,
          moduleSnapshot: dummySnapshot,
          stepTitles: dummyStepTitles,
        });
        expect(level).not.toBeNull();
        if (!level) return;

        const { text, keyboard } = presentNavLevel(level);

        expect(text).toContain(
          '📖 *Курсы*\n› Курс: Fullstack JS\n› Этап: Основы JS\n› Модуль: Введение в синтаксис\n› Проект: Введение в JS\n› Урок: Настройка окружения',
        );
        expect(text).toContain('Урок состоит из 2 шагов');
        expect(text).toContain('1\\. 🔹 Установка Bun');
        expect(text).toContain('2\\. 🔹 Запуск скрипта');

        // Клавиатура: НЕТ кнопок шагов, только навигация (След. урок) и назад к проекту
        expect(keyboard.rows).toHaveLength(2);
        expect(keyboard.rows[0]?.[0]?.text).toBe('След. урок ▶️');
        expect(keyboard.rows[0]?.[0]?.code).toBe(
          'course-catalog:lesson:course-1:0:mod-1:proj-1:les-2',
        );
        expect(keyboard.rows[1]?.[0]?.text).toBe('⬅️ Назад к проекту');
      });
    });
  });
});
