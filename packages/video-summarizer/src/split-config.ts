/**
 * Конфиг разбивки видео на части.
 * Для каждого видео: исходный файл + массив частей с метками, названиями, титрами.
 */
export interface PartConfig {
  /** Номер части */
  part: number;
  /** Временная метка начала MM:SS */
  start: string;
  /** Временная метка конца MM:SS (опционально, если нет — до конца) */
  end?: string;
  /** Название части для имени файла */
  title: string;
  /** Текст титров (2-3 сек в начале видео) */
  caption: string;
}

export interface VideoSplit {
  /** Путь к исходному видео */
  source: string;
  /** Куда класть части */
  outputDir: string;
  /** Части */
  parts: PartConfig[];
}

const BASE = '/home/nur/Videos/Основы js/dist/Основы js/Модуль 1/youtube';
const OUT = '/home/nur/Videos/Основы js/dist/Основы js/Модуль 1/youtube/parts';

export const SPLIT_CONFIG: VideoSplit[] = [
  // --- Циклы (34 мин) → 3 части (3+4 слиты) ---
  {
    source: `${BASE}/Циклы.mp4`,
    outputDir: `${OUT}/Циклы`,
    parts: [
      {
        part: 1,
        start: '00:00',
        end: '13:21',
        title: 'Концепция циклов и основы for',
        caption: 'Часть 1: Концепция циклов и основы for',
      },
      {
        part: 2,
        start: '13:21',
        end: '23:59',
        title: 'For для перебора строк',
        caption: 'Часть 2: For для перебора строк',
      },
      {
        part: 3,
        start: '23:59',
        title: 'while, do-while и итоги',
        caption: 'Часть 3: while, do-while и итоги',
      },
    ],
  },
  // --- Функции (41 мин) → 3 части (без изменений) ---
  {
    source: `${BASE}/Функции в js.mp4`,
    outputDir: `${OUT}/Функции в js`,
    parts: [
      {
        part: 1,
        start: '00:00',
        end: '11:55',
        title: 'Основы функций: тип, свойства и стили объявления',
        caption: 'Часть 1: Основы функций',
      },
      {
        part: 2,
        start: '11:55',
        end: '25:47',
        title: 'Передача данных в функции и типы данных',
        caption: 'Часть 2: Аргументы и передача типов',
      },
      {
        part: 3,
        start: '25:47',
        title: 'Продвинутые функциональные возможности',
        caption: 'Часть 3: Продвинутые возможности',
      },
    ],
  },
  // --- Приоритеты (35 мин) → 3 части (1+2 слиты) ---
  {
    source: `${BASE}/Приоритеты в разработке.mp4`,
    outputDir: `${OUT}/Приоритеты в разработке`,
    parts: [
      {
        part: 1,
        start: '00:00',
        end: '17:09',
        title: 'Введение и понятный код',
        caption: 'Часть 1: Приоритеты и понятный код',
      },
      {
        part: 2,
        start: '17:09',
        end: '25:07',
        title: 'Гибкий код и управление сложностью',
        caption: 'Часть 2: Гибкий код',
      },
      {
        part: 3,
        start: '25:07',
        title: 'Эффективность, минимализм и заключение',
        caption: 'Часть 3: Эффективность и минимализм',
      },
    ],
  },
  // --- Глобальная, локальная (78 мин) → 4 части ---
  {
    source: `${BASE}/Глобальная, локальная и время жизни переменной.mp4`,
    outputDir: `${OUT}/Глобальная и локальная`,
    parts: [
      {
        part: 1,
        start: '00:00',
        end: '19:30',
        title: 'Глобальная переменная',
        caption: 'Часть 1: Глобальная переменная',
      },
      {
        part: 2,
        start: '19:30',
        end: '39:00',
        title: 'Локальная переменная и оператор let',
        caption: 'Часть 2: Локальная и let',
      },
      {
        part: 3,
        start: '39:00',
        end: '58:30',
        title: 'Локальная переменная и оператор var',
        caption: 'Часть 3: Локальная и var',
      },
      {
        part: 4,
        start: '58:30',
        title: 'Сравнение let-var и оператор const',
        caption: 'Часть 4: let vs var и const',
      },
    ],
  },
  // --- Знакомимся с html (91 мин) → 5 частей ---
  {
    source: `${BASE}/Знакомимся с html, css, js. Как грузится html и выполняется js.mp4`,
    outputDir: `${OUT}/Знакомимся с HTML CSS JS`,
    parts: [
      {
        part: 1,
        start: '00:00',
        end: '18:00',
        title: 'Введение: файлы, HTML и редакторы кода',
        caption: 'Часть 1: Введение в веб-разработку',
      },
      {
        part: 2,
        start: '18:00',
        end: '37:00',
        title: 'Структура HTML: head, body, стили и скрипты',
        caption: 'Часть 2: Структура HTML-документа',
      },
      {
        part: 3,
        start: '37:00',
        end: '56:00',
        title: 'Загрузка HTML и Document Object Model (DOM)',
        caption: 'Часть 3: Загрузка HTML и DOM',
      },
      {
        part: 4,
        start: '56:00',
        end: '75:00',
        title: 'Манипуляции с DOM через JavaScript',
        caption: 'Часть 4: JS и манипуляции с DOM',
      },
      {
        part: 5,
        start: '75:00',
        title: 'Разделение ответственности: HTML, CSS, JS',
        caption: 'Часть 5: Разделение ответственности',
      },
    ],
  },
  // --- Отладка кода (55 мин) → 3 части ---
  {
    source: `${BASE}/Отладка кода js в браузере.mp4`,
    outputDir: `${OUT}/Отладка кода`,
    parts: [
      {
        part: 1,
        start: '00:00',
        end: '18:00',
        title: 'Введение в отладку и DevTools',
        caption: 'Часть 1: Введение в отладку и DevTools',
      },
      {
        part: 2,
        start: '18:00',
        end: '36:00',
        title: 'Отладка через console.log()',
        caption: 'Часть 2: Отладка через console.log',
      },
      {
        part: 3,
        start: '36:00',
        title: 'Пошаговая отладка с breakpoints',
        caption: 'Часть 3: Отладчик и точки останова',
      },
    ],
  },
  // --- Пишем первый код (79 мин) → 4 части ---
  {
    source: `${BASE}/Пишем первый код и подкрепляем теорию практикой.mp4`,
    outputDir: `${OUT}/Пишем первый код`,
    parts: [
      {
        part: 1,
        start: '00:00',
        end: '22:24',
        title: 'Цикл for и первая универсальная функция',
        caption: 'Часть 1: Цикл for и функция',
      },
      {
        part: 2,
        start: '22:24',
        end: '41:16',
        title: 'Улучшение функции с глубокой валидацией',
        caption: 'Часть 2: Универсальные циклы',
      },
      {
        part: 3,
        start: '41:16',
        end: '60:08',
        title: 'Итерация по строкам и задача FizzBuzz',
        caption: 'Часть 3: Строки и FizzBuzz',
      },
      {
        part: 4,
        start: '60:08',
        title: 'Решение FizzBuzz и порядок условий',
        caption: 'Часть 4: Решение и порядок условий',
      },
    ],
  },
];
