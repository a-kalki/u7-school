import { Role } from '@u7-scl/user/domain';
import type { WorldDefinition } from './types';

/**
 * Опорная дата мира core-education.
 * Все относительные даты T-... вычисляются от неё.
 */
export const CORE_EDUCATION_ANCHOR = new Date('2026-09-23T12:00:00.000Z');

/**
 * Определение продуктового мира `core-education`.
 * Включает 3 курса, 3 потока с различным жизненным циклом,
 * кампании peer-review с отзывами и dev-персоны для тестирования.
 */
export const CORE_EDUCATION_WORLD: WorldDefinition = {
  name: 'core-education',
  description:
    'Продуктовый мир с 3 курсами, завершённым и активным потоками, и кампаниями отзывов',
  anchorDate: CORE_EDUCATION_ANCHOR,

  persons: [
    {
      key: 'guest',
      uuid: '11111111-1111-1111-1111-111111111111',
      name: 'Гость',
      telegramId: 1001,
      roles: [Role.GUEST],
      registeredAt: 'T-90d',
    },
    {
      key: 'candidate',
      uuid: '22222222-2222-2222-2222-222222222222',
      name: 'Кандидат',
      telegramId: 1002,
      roles: [Role.SUBSCRIBER],
      registeredAt: 'T-80d',
    },
    {
      key: 'andrey',
      uuid: '33333333-3333-3333-3333-333333333333',
      name: 'Андрей',
      telegramId: 1003,
      roles: [Role.STUDENT],
      registeredAt: 'T-45d',
    },
    {
      key: 'dev',
      uuid: '44444444-4444-4444-4444-444444444444',
      name: 'Dev',
      telegramId: 1004,
      roles: [Role.MENTOR, Role.AUTHOR],
      registeredAt: 'T-90d',
    },
    {
      key: 'admin',
      uuid: '55555555-5555-5555-5555-555555555555',
      name: 'Администратор',
      telegramId: 1005,
      roles: [Role.ADMIN],
      registeredAt: 'T-90d',
    },
    {
      key: 'author',
      uuid: '66666666-6666-6666-6666-666666666666',
      name: 'Автор курсов',
      telegramId: 1006,
      roles: [Role.AUTHOR],
      registeredAt: 'T-90d',
    },
    {
      key: 'botAdmin',
      uuid: 'ae00f3f6-1392-4b98-b178-41c27e794b7f',
      name: 'Бот-админ',
      telegramId: 8781337572,
      roles: [Role.ADMIN],
      registeredAt: 'T-90d',
    },
    {
      key: 'marina',
      uuid: '77777777-7777-4777-8777-777777777777',
      name: 'Марина',
      telegramId: 1007,
      roles: [Role.STUDENT],
      registeredAt: 'T-40d',
    },
    {
      key: 'oleg',
      uuid: '88888888-8888-4888-8888-888888888888',
      name: 'Олег',
      telegramId: 1008,
      roles: [Role.STUDENT],
      registeredAt: 'T-40d',
    },
    {
      key: 'mentor2',
      uuid: '99999999-9999-4999-8999-999999999999',
      name: 'Виктор',
      telegramId: 1009,
      roles: [Role.MENTOR],
      registeredAt: 'T-90d',
    },
    {
      key: 'student-passed',
      uuid: '10101010-1010-4010-8010-101010101010',
      name: 'Дмитрий',
      telegramId: 1010,
      roles: [Role.STUDENT],
      registeredAt: 'T-90d',
    },
    {
      key: 'student-dropped',
      uuid: '10111011-1011-4011-8011-101110111011',
      name: 'Иван',
      telegramId: 1011,
      roles: [Role.STUDENT],
      registeredAt: 'T-90d',
    },
  ],

  courses: [
    {
      key: 'course-js-basics',
      uuid: 'fafafafa-baba-4aba-8aba-babababababa',
      title: 'Основы современного JavaScript',
      description:
        'Практический курс по современному JavaScript: от базового синтаксиса до асинхронных операций и архитектуры.',
      authorKey: 'dev',
      modules: [
        {
          key: 'mod-js-syntax',
          uuid: 'a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a0a0',
          title: 'Синтаксис и базовые структуры',
          description:
            'Фундаментальные основы языка, система типов, работа с объектами и массивами данных.',
          projects: [
            {
              key: 'proj-intro',
              uuid: 'b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b0',
              title: 'Введение в среду выполнения',
              lessons: [
                {
                  key: 'less-vars',
                  uuid: 'c0c0c0c0-c0c0-c0c0-c0c0-c0c0c0c0c0c0',
                  title: 'Переменные и примитивные типы',
                  steps: [
                    {
                      key: 'step-vars-decl',
                      uuid: 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
                      description:
                        'Разбор различий между объявлениями const и let. Принципы блочной области видимости и иммутабельности ссылок.',
                      content:
                        'В современном JavaScript рекомендуется объявлять переменные через const по умолчанию. Используйте let только в тех случаях, когда значение переменной действительно требуется переопределять в цикле или условии.',
                      theoryUrl:
                        'https://developer.mozilla.org/ru/docs/Web/JavaScript/Guide/Grammar_and_types',
                    },
                    {
                      key: 'step-data-types',
                      uuid: 'd1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1',
                      description:
                        'Примитивные типы данных: числа, строки, булевы значения, null и undefined.',
                      content:
                        'Язык JavaScript имеет динамическую типизацию с восемью встроенными типами. Примитивы передаются по значению, а составные структуры данных — по ссылке.',
                      theoryUrl: 'https://learn.javascript.ru/types',
                    },
                  ],
                },
                {
                  key: 'less-ops',
                  uuid: 'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1',
                  title: 'Операторы и ветвление логики',
                  steps: [
                    {
                      key: 'step-ops-cond',
                      uuid: 'd2d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2',
                      description:
                        'Условные конструкции if/else, тернарный оператор и операторы нулевого слияния.',
                      content:
                        'Операторы строгой проверки на равенство гарантируют предсказуемость поведения программ без неявного приведения типов.',
                      theoryUrl: 'https://learn.javascript.ru/comparison',
                    },
                  ],
                },
              ],
            },
            {
              key: 'proj-loops-fns',
              uuid: 'b3b3b3b3-b3b3-b3b3-b3b3-b3b3b3b3b3b3',
              title: 'Циклы и функциональное проектирование',
              lessons: [
                {
                  key: 'less-loops',
                  uuid: 'c4c4c4c4-c4c4-c4c4-c4c4-c4c4c4c4c4c4',
                  title: 'Итерация и циклы',
                  steps: [
                    {
                      key: 'step-loops-for',
                      uuid: 'd6d6d6d6-d6d6-d6d6-d6d6-d6d6d6d6d6d6',
                      description:
                        'Классический цикл for, перебор коллекций через for..of и методы массивов.',
                      content:
                        'Изучаем итерируемые протоколы и методы высшего порядка map, filter, reduce для декларативной обработки коллекций.',
                      theoryUrl:
                        'https://developer.mozilla.org/ru/docs/Web/JavaScript/Reference/Global_Objects/Array',
                    },
                    {
                      key: 'step-loops-fns',
                      uuid: 'd7d7d7d7-d7d7-d7d7-d7d7-d7d7d7d7d7d7',
                      description:
                        'Чистые функции, передача аргументов и замыкания контекста выполнения.',
                      content:
                        'Функции первого класса позволяют строить надежные композиции и разделять бизнес-логику на изолированные модули.',
                      theoryUrl: 'https://learn.javascript.ru/function-basics',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      key: 'course-algorithms',
      uuid: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      title: 'Алгоритмы и структуры данных',
      description:
        'Курс по оценке сложности вычислений, структурам данных и классическим алгоритмам решения задач.',
      authorKey: 'dev',
      modules: [
        {
          key: 'mod-algo-core',
          uuid: 'a1a1a1a1-b1b1-4b1b-8b1b-b1b1b1b1b1b1',
          title: 'Базовые алгоритмы и поиск',
          description:
            'Оценка сложности по O-нотации, линейный поиск, бинарный поиск и базовые сортировки.',
          projects: [
            {
              key: 'proj-search',
              uuid: 'b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1',
              title: 'Алгоритмы поиска',
              lessons: [
                {
                  key: 'less-search-linear',
                  uuid: 'c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2',
                  title: 'Линейный и бинарный поиск',
                  steps: [
                    {
                      key: 'step-algo-search',
                      uuid: 'e6e6e6e6-e6e6-e6e6-e6e6-e6e6e6e6e6e6',
                      description:
                        'Сравнение алгоритмов поиска по временной и пространственной сложности.',
                      content:
                        'Линейный поиск работает за O(n), в то время как бинарный поиск по отсортированному массиву находит элемент за логарифмическое время O(log n).',
                      theoryUrl:
                        'https://en.wikipedia.org/wiki/Binary_search_algorithm',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      key: 'course-uxui-design',
      uuid: '29adc3be-873e-47ec-aa30-61f5e6e25d4e',
      title: 'UX/UI Дизайн цифровых продуктов',
      description:
        'Курс по исследованию пользовательского опыта, проектированию интерфейсов и прототипированию в Figma.',
      authorKey: 'dev',
      modules: [
        {
          key: 'mod-ux-research',
          uuid: 'a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2',
          title: 'Исследование пользовательского опыта',
          description:
            'Интервью с пользователями, CJM, составление гипотез и формирование требований к интерфейсу.',
          projects: [
            {
              key: 'proj-cjm',
              uuid: 'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2',
              title: 'Проектирование пользовательского пути',
              lessons: [
                {
                  key: 'less-cjm-basics',
                  uuid: 'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3',
                  title: 'Составление карты пути пользователя',
                  steps: [
                    {
                      key: 'step-cjm-steps',
                      uuid: 'd3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d3d3',
                      description:
                        'Определение ключевых точек касания, болей и эмоций пользователей при работе с интерфейсом.',
                      content:
                        'Карта клиентского пути (CJM) позволяет визуализировать все этапы взаимодействия клиента с продуктом и выявить барьеры для конверсии.',
                      theoryUrl:
                        'https://www.nngroup.com/articles/customer-journey-mapping/',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],

  streams: [
    {
      key: 'stream-1-completed',
      uuid: 'e2e2e2e2-e2e2-e2e2-e2e2-e2e2e2e2e2e2',
      title: 'JavaScript Основы — Выпускной Поток 1',
      description:
        'Первый выпускной поток. Студенты успешно завершили программу и прошли peer-review.',
      courseKey: 'course-js-basics',
      moduleKey: 'mod-js-syntax',
      mentorKey: 'mentor2',
      status: 'completed',
      startedAt: 'T-60d',
      telegramGroupId: '-1004444444444',
    },
    {
      key: 'stream-2-active',
      uuid: 'e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1',
      title: 'JavaScript Основы — Действующий Поток 2',
      description:
        'Основной рабочий поток в процессе обучения. Студенты выполняют практические задания.',
      courseKey: 'course-js-basics',
      moduleKey: 'mod-js-syntax',
      mentorKey: 'dev',
      status: 'active',
      startedAt: 'T-15d',
      telegramGroupId: '-1002222222222',
    },
    {
      key: 'stream-3-enrollment',
      uuid: 'e4e4e4e4-e4e4-e4e4-e4e4-e4e4e4e4e4e4',
      title: 'JavaScript Основы — Набор в Поток 3',
      description:
        'Идёт приём заявок и формирование учебных групп на следующий сезон.',
      courseKey: 'course-js-basics',
      moduleKey: 'mod-js-syntax',
      mentorKey: 'dev',
      status: 'enrollment',
      startedAt: 'T+10d',
      telegramGroupId: '-1003333333333',
    },
  ],

  students: [
    {
      key: 'student-passed-s1',
      uuid: 'f1010101-1010-4010-8010-101010101010',
      personKey: 'student-passed',
      streamKey: 'stream-1-completed',
      enrolledAt: 'T-60d',
      status: 'advanced',
      currentStepKey: 'step-loops-fns',
      steps: [
        {
          stepKey: 'step-vars-decl',
          status: 'completed',
          issuedAt: 'T-55d',
          completedAt: 'T-45d',
        },
        {
          stepKey: 'step-loops-fns',
          status: 'completed',
          issuedAt: 'T-20d',
          completedAt: 'T-2d',
        },
      ],
    },
    {
      key: 'student-dropped-s1',
      uuid: 'f1011101-1011-4011-8011-101110111011',
      personKey: 'student-dropped',
      streamKey: 'stream-1-completed',
      enrolledAt: 'T-60d',
      status: 'abandoned',
      currentStepKey: 'step-vars-decl',
      steps: [
        {
          stepKey: 'step-vars-decl',
          status: 'issued',
          issuedAt: 'T-55d',
        },
      ],
    },
    {
      key: 'student-andrey-s2',
      uuid: 'f0f0f0f0-f0f0-f0f0-f0f0-f0f0f0f0f0f0',
      personKey: 'andrey',
      streamKey: 'stream-2-active',
      enrolledAt: 'T-15d',
      status: 'active',
      currentStepKey: 'step-vars-decl',
      steps: [
        {
          stepKey: 'step-vars-decl',
          status: 'issued',
          issuedAt: 'T-15d',
        },
      ],
    },
    {
      key: 'student-marina-s2',
      uuid: 'f1f1f1f1-f1f1-f1f1-f1f1-f1f1f1f1f1f1',
      personKey: 'marina',
      streamKey: 'stream-2-active',
      enrolledAt: 'T-15d',
      status: 'active',
      currentStepKey: 'step-vars-decl',
      steps: [
        {
          stepKey: 'step-vars-decl',
          status: 'issued',
          issuedAt: 'T-15d',
        },
      ],
    },
    {
      key: 'student-oleg-s2',
      uuid: 'f2f2f2f2-f2f2-f2f2-f2f2-f2f2f2f2f2f2',
      personKey: 'oleg',
      streamKey: 'stream-2-active',
      enrolledAt: 'T-15d',
      status: 'active',
      currentStepKey: 'step-vars-decl',
      steps: [
        {
          stepKey: 'step-vars-decl',
          status: 'issued',
          issuedAt: 'T-15d',
        },
      ],
    },
  ],

  campaigns: [
    {
      key: 'camp-live-passed',
      uuid: 'c1a11111-1111-4111-8111-111111111111',
      context: 'stream_fate',
      streamKey: 'stream-1-completed',
      subjectPersonKey: 'student-passed',
      mentorPersonKey: 'mentor2',
      subjectOutcome: 'completed_passed',
      createdAt: 'T-2d',
      expiresAt: 'T+5d',
      participants: ['student-dropped'],
    },
    {
      key: 'camp-expired-dropped',
      uuid: 'c4a44444-4444-4444-8444-444444444444',
      context: 'stream_fate',
      streamKey: 'stream-1-completed',
      subjectPersonKey: 'student-dropped',
      mentorPersonKey: 'mentor2',
      subjectOutcome: 'dropped',
      createdAt: 'T-30d',
      expiresAt: 'T-23d',
      participants: [],
    },
  ],

  reviews: [
    {
      key: 'rev-passed-to-mentor',
      uuid: '10000000-0000-4000-8000-000000000001',
      campaignKey: 'camp-live-passed',
      authorPersonKey: 'student-passed',
      recipientPersonKey: 'mentor2',
      direction: 'student_mentor',
      authorOutcome: 'completed_passed',
      text: 'Виктор детально разбирал каждое домашнее задание и подсказывал неочевидные краевые случаи. Очень помог структурировать понимание асинхронного кода.',
      createdAt: 'T-1d',
    },
  ],
};
