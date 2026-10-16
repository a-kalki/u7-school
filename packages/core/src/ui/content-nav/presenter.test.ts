import { describe, expect, test } from 'bun:test';
import {
  buildNavLevelKeyboard,
  formatNavLevelText,
  presentNavLevel,
} from './presenter';
import type { NavLevel } from './types';

describe('NavLevel Presenter (TDD)', () => {
  describe('formatNavLevelText', () => {
    test('шапка с цепочкой хлебных крошек (drill-down путь)', () => {
      const level: NavLevel = {
        breadcrumbs: ['📂 Уроки', 'Введение в web', 'Как устроен web'],
        subtitle: 'Урок состоит из 3 шагов',
        back: 'nav:project',
      };

      const mdText = formatNavLevelText(level);

      // Проверяем наличие хлебных крошек и пояснения
      expect(mdText).toContain('📂 *Уроки* › Введение в web › Как устроен web');
      expect(mdText).toContain('Урок состоит из 3 шагов');
    });

    test('шапка с многострочными хлебными крошками (multilineBreadcrumbs) и жирным последним уровнем', () => {
      const level: NavLevel = {
        breadcrumbs: ['📖 Курсы', 'Курс: Fullstack JS', 'Этап: Синтаксис'],
        multilineBreadcrumbs: true,
        back: 'nav:root',
      };

      const mdText = formatNavLevelText(level);
      expect(mdText).toContain(
        '📖 *Курсы*\n› Курс: Fullstack JS\n› *Этап: Синтаксис*',
      );
    });

    test('обрезает промежуточные сегменты хлебных крошек по границе слов, не затрагивая последний', () => {
      const level: NavLevel = {
        breadcrumbs: [
          '📖 Курсы',
          'Курс: Очень длинный курс по веб-разработке и сервисам',
          'Этап: Архитектура распределённых микросервисных приложений',
          'Модуль: Паттерны проектирования и лучшие практики (1 из 5)',
        ],
        multilineBreadcrumbs: true,
        back: 'nav:root',
      };

      const mdText = formatNavLevelText(level);
      // Промежуточные сегменты обрезаются по словам с многоточием (до 34 симв), висячий предлог "по" отсекается, точки экранируются в MarkdownV2
      expect(mdText).toContain('› Курс: Очень длинный курс\\.\\.\\.');
      expect(mdText).toContain('› Этап: Архитектура\\.\\.\\.');
      // Последний сегмент остаётся целым и выделяется жирным
      expect(mdText).toContain(
        '› *Модуль: Паттерны проектирования и лучшие практики \\(1 из 5\\)*',
      );
    });

    test('экранирование спецсимволов MarkdownV2 в заголовках', () => {
      const level: NavLevel = {
        breadcrumbs: [
          '📖 Программа модуля',
          'Обработка ошибок: try-catch (v1.0)',
        ],
        subtitle: 'Проект состоит из 1 урока.',
        back: 'nav:root',
      };

      const mdText = formatNavLevelText(level);
      // При рендере спецсимволы вроде -, (, ), . должны быть экранированы в MarkdownV2
      expect(mdText).toContain('try\\-catch');
      expect(mdText).toContain('\\(v1\\.0\\)');
    });

    test('рендер списка детей с номерами, статусами, мета и подуровнями', () => {
      const level: NavLevel = {
        breadcrumbs: ['📂 Уроки'],
        subtitle: 'Модуль состоит из 2 проектов',
        children: [
          {
            id: 'p1',
            index: 1,
            title: 'Проект: Введение в web',
            meta: '(2/5)',
            status: 'completed',
            enterable: true,
            address: 'nav:p1',
            children: [
              {
                title: 'Урок 1: Как устроен web',
                emoji: '📝',
                meta: '(3/3)',
                status: 'completed',
              },
              {
                title: 'Урок 2: Бэкенд',
                emoji: '📝',
                meta: '(0/2)',
                status: 'in_progress',
              },
            ],
          },
          {
            id: 'p2',
            index: 2,
            title: 'Проект: Инфраструктура',
            meta: '(0/3)',
            status: 'locked',
            enterable: false,
          },
        ],
        back: 'nav:back',
      };

      const mdText = formatNavLevelText(level);

      expect(mdText).toContain('1\\. ✅ Введение в web \\(2/5\\)');
      expect(mdText).toContain('    Урок 1: Как устроен web \\(3/3\\) ✅');
      expect(mdText).toContain('    Урок 2: Бэкенд \\(0/2\\) ▶️');
      expect(mdText).toContain('2\\. 🔒 Инфраструктура \\(0/3\\)');
    });

    test('карточка выводит заголовок и упрощенный список', () => {
      const level: NavLevel = {
        breadcrumbs: ['📖 Курсы', 'Fullstack JS'],
        subtitle: 'Этапы курса:',
        children: [
          {
            id: 'ph1',
            index: 1,
            title: 'Этап: Основы',
            emoji: '🏛',
            enterable: true,
            children: [
              {
                title: 'Модуль: Введение',
                emoji: '📦',
              },
            ],
          },
        ],
        back: 'nav:root',
      };

      const mdText = formatNavLevelText(level);
      expect(mdText).toContain('*Этапы курса:*');
      expect(mdText).toContain('1\\. Основы');
      expect(mdText).toContain('    Введение');
    });

    test('рендер одноуровневого списка детей со статусами', () => {
      const level: NavLevel = {
        breadcrumbs: ['📂 Уроки', 'Web', 'Урок 1'],
        subtitle: 'Шаги урока:',
        children: [
          {
            id: 's1',
            index: 1,
            title: 'Шаг 1: Теория',
            status: 'completed',
            enterable: true,
            address: 'nav:s1',
          },
          {
            id: 's2',
            index: 2,
            title: 'Шаг 2: Практика',
            status: 'in_progress',
            enterable: true,
            address: 'nav:s2',
          },
          {
            id: 's3',
            index: 3,
            title: 'Шаг 3: Тест',
            status: 'locked',
            enterable: false,
          },
        ],
        back: 'nav:p1',
      };

      const mdText = formatNavLevelText(level);

      expect(mdText).toContain('*Шаги урока:*');
      expect(mdText).toContain('1\\. ✅ Теория');
      expect(mdText).toContain('2\\. ▶️ Практика');
      expect(mdText).toContain('3\\. 🔒 Тест');
    });

    test('рендер карточки шага с телом контента и статусом', () => {
      const level: NavLevel = {
        breadcrumbs: ['📂 Уроки', 'Web', 'Урок 1', 'Шаг 2'],
        status: 'in_progress',
        statusLabel: 'В процессе',
        body: 'Задание: напишите функцию greet.',
        back: 'nav:l1',
      };

      const mdText = formatNavLevelText(level);

      expect(mdText).toContain('📂 *Уроки* › Web › Урок 1 › Шаг 2');
      expect(mdText).toContain('▶️ В процессе');
      expect(mdText).toContain('Задание: напишите функцию greet\\.');
    });
  });

  describe('buildNavLevelKeyboard', () => {
    test('кнопки подуровней упрощаются: без эмодзи и префикса уровня', () => {
      const level: NavLevel = {
        breadcrumbs: ['📖 Курсы', 'Fullstack JS'],
        children: [
          {
            id: 'ph1',
            index: 1,
            title: 'Этап: Синтаксис',
            emoji: '🏛',
            enterable: true,
            address: 'nav:ph1',
          },
          {
            id: 'ph2',
            index: 2,
            title: '📁 Проект: Введение в Web',
            emoji: '📁',
            meta: '(2/5)',
            enterable: true,
            address: 'nav:ph2',
          },
          {
            id: 'ph3',
            index: 3,
            title: '📝 Урок: Переменные',
            enterable: true,
            address: 'nav:ph3',
          },
        ],
        back: 'nav:root',
      };

      const kbDesc = buildNavLevelKeyboard(level);

      expect(kbDesc.rows[0]?.[0]?.text).toBe('1. Синтаксис');
      expect(kbDesc.rows[1]?.[0]?.text).toBe('2. Введение в Web (2/5)');
      expect(kbDesc.rows[2]?.[0]?.text).toBe('3. Переменные');
    });

    test('длинные названия кнопок обрезаются по границе целого слова с многоточием', () => {
      const level: NavLevel = {
        breadcrumbs: ['📖 Курсы'],
        children: [
          {
            id: 'p1',
            index: 1,
            title: '📁 Проект: Git и GitHub: первый репозиторий и Pull Request',
            enterable: true,
            address: 'nav:p1',
          },
        ],
        back: 'nav:root',
      };

      const kbDesc = buildNavLevelKeyboard(level);
      const btnText = kbDesc.rows[0]?.[0]?.text ?? '';
      expect(btnText.length).toBeLessThanOrEqual(44);
      expect(btnText).toBe('1. Git и GitHub: первый репозиторий...');
    });

    test('навигационный ряд соседей: оба соседа присутствуют', () => {
      const level: NavLevel = {
        breadcrumbs: ['📂 Уроки', 'Web'],
        prev: { address: 'nav:prev', label: '◀️ Пред. проект' },
        next: { address: 'nav:next', label: 'След. проект ▶️' },
        back: { address: 'nav:root', label: '⬅️ Назад к модулю' },
      };

      const kbDesc = buildNavLevelKeyboard(level);

      expect(kbDesc.rows.length).toBe(2);
      // Первый ряд — соседи (2 кнопки в одном ряду)
      expect(kbDesc.rows[0]?.length).toBe(2);
      expect(kbDesc.rows[0]?.[0]?.text).toBe('◀️ Пред. проект');
      expect(kbDesc.rows[0]?.[0]?.code).toBe('nav:prev');
      expect(kbDesc.rows[0]?.[1]?.text).toBe('След. проект ▶️');
      expect(kbDesc.rows[0]?.[1]?.code).toBe('nav:next');

      // Второй ряд — Назад
      expect(kbDesc.rows[1]?.[0]?.text).toBe('⬅️ Назад к модулю');
    });

    test('границы списка: нет prev на первом элементе, нет next на последнем', () => {
      // Первый элемент (нет prev)
      const firstLevel: NavLevel = {
        breadcrumbs: ['📂 Уроки', 'Web'],
        next: { address: 'nav:p2', label: 'След. проект ▶️' },
        back: 'nav:root',
      };
      const kbFirst = buildNavLevelKeyboard(firstLevel);
      expect(kbFirst.rows[0]?.length).toBe(1);
      expect(kbFirst.rows[0]?.[0]?.text).toBe('След. проект ▶️');

      // Последний элемент (нет next)
      const lastLevel: NavLevel = {
        breadcrumbs: ['📂 Уроки', 'Web'],
        prev: { address: 'nav:p1', label: '◀️ Пред. проект' },
        back: 'nav:root',
      };
      const kbLast = buildNavLevelKeyboard(lastLevel);
      expect(kbLast.rows[0]?.length).toBe(1);
      expect(kbLast.rows[0]?.[0]?.text).toBe('◀️ Пред. проект');
    });

    test('дополнительные ряды кнопок (extraRows) после навигации, перед кнопкой назад', () => {
      const level: NavLevel = {
        breadcrumbs: ['📖 Курсы', 'Курс: Fullstack JS'],
        children: [
          {
            id: 'ph1',
            index: 1,
            title: 'Синтаксис',
            enterable: true,
            address: 'course:phase:ph1',
          },
        ],
        extraRows: [[{ text: '🎓 Хочу пройти курс', code: 'course:wish:c1' }]],
        prev: { address: 'course:root:prev', label: '◀️ Пред.' },
        next: { address: 'course:root:next', label: 'След. ▶️' },
        back: { address: 'menu:root', label: '⬅️ Назад' },
      };

      const kbDesc = buildNavLevelKeyboard(level);
      // Ожидаем 4 ряда: 1) child, 2) prev/next, 3) extraRow (wish), 4) back
      expect(kbDesc.rows.length).toBe(4);
      expect(kbDesc.rows[0]?.[0]?.text).toContain('1. Синтаксис');
      expect(kbDesc.rows[1]?.[0]?.text).toBe('◀️ Пред.');
      expect(kbDesc.rows[1]?.[1]?.text).toBe('След. ▶️');
      expect(kbDesc.rows[2]?.[0]?.text).toBe('🎓 Хочу пройти курс');
      expect(kbDesc.rows[3]?.[0]?.text).toBe('⬅️ Назад');
    });
  });

  describe('presentNavLevel', () => {
    test('возвращает объект { text, keyboard }', () => {
      const level: NavLevel = {
        breadcrumbs: ['📂 Уроки'],
        subtitle: 'Пояснение',
        back: 'nav:root',
      };

      const res = presentNavLevel(level);
      expect(res.text).toBeDefined();
      expect(res.keyboard).toBeDefined();
      expect(res.keyboard.rows.length).toBe(1);
    });
  });
});
