/**
 * Seed-скрипт: наполняет БД контентом модуля "Основы JS".
 *
 * Использует CourseApiModule через handle()
 * с actorId = Nur (ADMIN + MENTOR).
 */

import { CourseApiModule } from '@u7-scl/course/api';
import {
  LessonJsonRepo,
  ModuleJsonRepo,
  StepJsonRepo,
} from '@u7-scl/course/infra';
import { UserApiModule } from '@u7-scl/user/api';
import { UserInProcFacade, UserJsonRepo } from '@u7-scl/user/infra';

const NUR_UUID = '8d9a56f6-51e7-49f0-ba58-2832b157e718';

async function main() {
  // ─── 1. Резолверы ──────────────────────────────────
  const moduleRepo = new ModuleJsonRepo();
  const lessonRepo = new LessonJsonRepo();
  const stepRepo = new StepJsonRepo();

  const userRepo = new UserJsonRepo();
  const userApi = new UserApiModule({ userRepo });
  const userFacade = new UserInProcFacade(userApi);

  const courseApi = new CourseApiModule({
    courseRepo: moduleRepo,
    lessonRepo,
    stepRepo,
    userFacade,
  });

  const h = (name: string, attrs: Record<string, unknown>) =>
    courseApi.handle({ name, attrs, actorId: NUR_UUID });

  // ─── 2. Создаём модуль ──────────────────────────────
  console.log('🔄 Создаём модуль "Основы JS"...');
  const module = (await h('create-module', {
    title: 'Основы JS',
    description:
      'Изучаем синтаксис языка JavaScript с нуля. Научишься писать первые программы, работать с данными и управлять логикой кода.',
  })) as { uuid: string; projects: { uuid: string; title: string }[] };
  console.log(`  ✅ Модуль создан: ${module.uuid}`);

  // ─── 3. Обогащаем модуль ──────────────────────────
  console.log('🔄 Обогащаем модуль...');
  await h('enrich-module', {
    moduleId: module.uuid,
    targetAudience:
      'Новички в программировании, которые хотят начать писать на JavaScript',
    goal: 'Освоить базовый синтаксис JavaScript: переменные, типы данных, операторы, условия, циклы, функции, массивы и объекты',
    result:
      'Сможешь писать простые скрипты, работать с переменными, функциями, массивами и объектами. Понимать чужой код и уверенно использовать базовые конструкции языка.',
    rules:
      '— Будь вежлив и уважительно относись к другим студентам\n— Выполняй задания самостоятельно\n— Если что-то непонятно — спрашивай ментора',
    additional:
      'Этот курс — твой первый шаг в мир JavaScript. Не бойся ошибаться, на ошибках учатся! 💪',
    tags: ['javascript', 'js', 'основы', 'новичкам'],
  });
  console.log('  ✅ Модуль обогащён');

  // ─── 4. Проект 1: «Введение в JavaScript» ─────────
  console.log('🔄 Создаём проект "Введение в JavaScript"...');
  const p1 = (await h('add-project', {
    moduleId: module.uuid,
    title: 'Введение в JavaScript',
    goal: 'Познакомиться с языком, научиться объявлять переменные и работать с базовыми типами данных',
    result: 'Умеешь объявлять переменные, знаешь типы данных и операторы',
  })) as { projects: { uuid: string; title: string }[] };
  const p1uuid = p1.projects.find(
    (p) => p.title === 'Введение в JavaScript',
  )?.uuid;
  console.log(`  ✅ Проект создан: ${p1uuid}`);

  // Урок 1.1: Переменные и типы данных
  console.log('🔄 Создаём урок "Переменные и типы данных"...');
  const l1_1 = (await h('create-lesson', {
    moduleId: module.uuid,
    projectId: p1uuid,
    title: 'Переменные и типы данных',
    additional: 'Разберёмся с тем, как хранить данные в JavaScript',
    estimatedMinutes: 30,
  })) as { uuid: string };
  console.log(`  ✅ Урок создан: ${l1_1.uuid}`);

  // Шаги урока 1.1
  await h('create-step', {
    moduleId: module.uuid,
    lessonId: l1_1.uuid,
    description: 'Что такое JavaScript?',
    kind: 'text',
    content: `JavaScript (JS) — это язык программирования, который делает веб-страницы живыми и интерактивными.

Он работает прямо в браузере, но также используется на серверах (Node.js), в мобильных приложениях и даже в роботах!

**Почему JS — отличный старт?**
- Простой и понятный синтаксис
- Мгновенный результат — открыл браузер и пишешь код
- Огромное сообщество и тысячи библиотек
- Можно найти работу, зная только JS`,
  });

  await h('create-step', {
    moduleId: module.uuid,
    lessonId: l1_1.uuid,
    description: 'Объявление переменных: let и const',
    kind: 'code',
    content:
      'Переменные — это «коробки» для хранения данных. В JS их объявляют двумя способами:\n\n**let** — переменная, которую можно изменить\n**const** — константа, которую нельзя перезаписать',
    code: `// Объявляем переменную с let
let name = 'Аня';
console.log(name); // Аня

name = 'Петя'; // Можно изменить
console.log(name); // Петя

// Объявляем константу с const
const birthYear = 1990;
console.log(birthYear); // 1990

// birthYear = 2000; // Ошибка! Константу нельзя перезаписать`,
    language: 'javascript',
  });

  await h('create-step', {
    moduleId: module.uuid,
    lessonId: l1_1.uuid,
    description: 'Типы данных',
    kind: 'code',
    content:
      'В JavaScript есть несколько базовых типов данных:\n\n**String** — строка (текст)\n**Number** — число\n**Boolean** — true/false\n**null** — ничего\n**undefined** — значение не назначено',
    code: `// Строка (String)
const greeting = 'Привет, мир!';
const name = "Аня";

// Число (Number)
const age = 25;
const price = 99.99;

// Булево (Boolean)
const isStudent = true;
const isAdult = false;

// null — намеренно пустое значение
const nothing = null;

// undefined — значение ещё не назначено
let futureValue;
console.log(futureValue); // undefined

// typeof — узнаём тип
console.log(typeof greeting); // string
console.log(typeof age);     // number
console.log(typeof isStudent); // boolean`,
    language: 'javascript',
  });

  // Урок 1.2: Операторы
  console.log('🔄 Создаём урок "Операторы"...');
  const l1_2 = (await h('create-lesson', {
    moduleId: module.uuid,
    projectId: p1uuid,
    title: 'Операторы',
    additional: 'Научимся выполнять вычисления и сравнения',
    estimatedMinutes: 25,
  })) as { uuid: string };
  console.log(`  ✅ Урок создан: ${l1_2.uuid}`);

  await h('create-step', {
    moduleId: module.uuid,
    lessonId: l1_2.uuid,
    description: 'Арифметические операторы',
    kind: 'code',
    content: 'С числами можно выполнять все базовые математические операции:',
    code: `const a = 10;
const b = 3;

console.log(a + b);  // 13  (сложение)
console.log(a - b);  // 7   (вычитание)
console.log(a * b);  // 30  (умножение)
console.log(a / b);  // 3.33 (деление)
console.log(a % b);  // 1   (остаток от деления)
console.log(a ** b); // 1000 (возведение в степень)

// Инкремент и декремент
let count = 0;
count++; // теперь 1
count--; // снова 0`,
    language: 'javascript',
  });

  await h('create-step', {
    moduleId: module.uuid,
    lessonId: l1_2.uuid,
    description: 'Операторы сравнения',
    kind: 'code',
    content: 'Операторы сравнения возвращают true или false:',
    code: `console.log(5 > 3);   // true
console.log(5 < 3);   // false
console.log(5 >= 5);  // true
console.log(5 === 5); // true (строгое равенство)
console.log(5 !== 3); // true (не равно)

// ВАЖНО: === vs ==
console.log(5 === '5'); // false (разные типы)
console.log(5 == '5');  // true (нестрогое — плохая практика!)`,
    language: 'javascript',
  });

  await h('create-step', {
    moduleId: module.uuid,
    lessonId: l1_2.uuid,
    description: 'Логические операторы',
    kind: 'code',
    content: 'Логические операторы помогают комбинировать условия:',
    code: `const age = 20;
const hasLicense = true;

// && (И) — все условия должны быть true
console.log(age >= 18 && hasLicense); // true

// || (ИЛИ) — хотя бы одно true
console.log(age < 18 || hasLicense);  // true

// ! (НЕ) — отрицание
console.log(!hasLicense); // false`,
    language: 'javascript',
  });

  // ─── 5. Проект 2: «Управление потоком» ────────────
  console.log('🔄 Создаём проект "Управление потоком"...');
  const p2 = (await h('add-project', {
    moduleId: module.uuid,
    title: 'Управление потоком',
    goal: 'Научиться управлять выполнением кода с помощью условий и циклов',
    result: 'Умеешь писать ветвления и циклы для решения задач',
  })) as { projects: { uuid: string; title: string }[] };
  const p2uuid = p2.projects.find(
    (p) => p.title === 'Управление потоком',
  )?.uuid;
  console.log(`  ✅ Проект создан: ${p2uuid}`);

  // Урок 2.1: Условные конструкции
  console.log('🔄 Создаём урок "Условные конструкции"...');
  const l2_1 = (await h('create-lesson', {
    moduleId: module.uuid,
    projectId: p2uuid,
    title: 'Условные конструкции',
    additional: 'Научимся принимать решения в коде',
    estimatedMinutes: 30,
  })) as { uuid: string };
  console.log(`  ✅ Урок создан: ${l2_1.uuid}`);

  await h('create-step', {
    moduleId: module.uuid,
    lessonId: l2_1.uuid,
    description: 'if / else if / else',
    kind: 'code',
    content:
      'Условные конструкции позволяют выполнять разный код в зависимости от условий.',
    code: `const temperature = 25;

if (temperature > 30) {
  console.log('Очень жарко 🥵');
} else if (temperature > 20) {
  console.log('Тепло и комфортно 😊');
} else if (temperature > 10) {
  console.log('Прохладно 🧥');
} else {
  console.log('Холодно 🥶');
}
// Вывод: Тепло и комфортно 😊`,
    language: 'javascript',
  });

  await h('create-step', {
    moduleId: module.uuid,
    lessonId: l2_1.uuid,
    description: 'switch',
    kind: 'code',
    content:
      'switch — альтернатива if, когда нужно сравнить одну переменную со множеством значений.',
    code: `const day = 3;
let dayName;

switch (day) {
  case 1:
    dayName = 'Понедельник';
    break;
  case 2:
    dayName = 'Вторник';
    break;
  case 3:
    dayName = 'Среда';
    break;
  case 4:
    dayName = 'Четверг';
    break;
  case 5:
    dayName = 'Пятница';
    break;
  default:
    dayName = 'Выходной';
}

console.log(dayName); // Среда`,
    language: 'javascript',
  });

  await h('create-step', {
    moduleId: module.uuid,
    lessonId: l2_1.uuid,
    description: 'Тернарный оператор',
    kind: 'code',
    content:
      'Тернарный оператор — короткая запись if/else в одну строку.\n\n**Синтаксис:** условие ? значениеЕслиTrue : значениеЕслиFalse',
    code: `const age = 20;
const canVote = age >= 18 ? 'Можно голосовать' : 'Ещё рано';
console.log(canVote); // Можно голосовать

// То же самое через if/else:
let canVote2;
if (age >= 18) {
  canVote2 = 'Можно голосовать';
} else {
  canVote2 = 'Ещё рано';
}`,
    language: 'javascript',
  });

  // Урок 2.2: Циклы
  console.log('🔄 Создаём урок "Циклы"...');
  const l2_2 = (await h('create-lesson', {
    moduleId: module.uuid,
    projectId: p2uuid,
    title: 'Циклы',
    additional: 'Научимся повторять действия автоматически',
    estimatedMinutes: 30,
  })) as { uuid: string };
  console.log(`  ✅ Урок создан: ${l2_2.uuid}`);

  await h('create-step', {
    moduleId: module.uuid,
    lessonId: l2_2.uuid,
    description: 'Цикл for',
    kind: 'code',
    content:
      'Цикл for повторяет код заданное количество раз.\n\n**Синтаксис:** for (начало; условие; шаг) { тело }',
    code: `// Выводим числа от 1 до 5
for (let i = 1; i <= 5; i++) {
  console.log('Шаг:', i);
}
// Вывод:
// Шаг: 1
// Шаг: 2
// Шаг: 3
// Шаг: 4
// Шаг: 5

// Считаем сумму чисел от 1 до 100
let sum = 0;
for (let i = 1; i <= 100; i++) {
  sum += i;
}
console.log('Сумма:', sum); // 5050`,
    language: 'javascript',
  });

  await h('create-step', {
    moduleId: module.uuid,
    lessonId: l2_2.uuid,
    description: 'Цикл while и do...while',
    kind: 'code',
    content:
      'while — выполняется пока условие true.\ndo...while — выполняется хотя бы один раз, даже если условие false.',
    code: `// while
let i = 0;
while (i < 3) {
  console.log('while:', i);
  i++;
}
// while: 0, while: 1, while: 2

// do...while
let j = 0;
do {
  console.log('do-while:', j);
  j++;
} while (j < 3);
// do-while: 0, do-while: 1, do-while: 2

// Разница: do...while выполнится хотя бы 1 раз
let k = 10;
do {
  console.log('Выполнится 1 раз:', k);
} while (k < 3);`,
    language: 'javascript',
  });

  await h('create-step', {
    moduleId: module.uuid,
    lessonId: l2_2.uuid,
    description: 'Цикл for...of',
    kind: 'code',
    content: 'for...of — удобный способ перебора элементов массива или строки.',
    code: `const fruits = ['🍎', '🍊', '🍋', '🍇'];

// Перебираем массив
for (const fruit of fruits) {
  console.log(fruit);
}
// 🍎, 🍊, 🍋, 🍇

// Можно перебирать строку
const word = 'JS';
for (const char of word) {
  console.log(char);
}
// J, S`,
    language: 'javascript',
  });

  // ─── 6. Проект 3: «Функции» ──────────────────────
  console.log('🔄 Создаём проект "Функции"...');
  const p3 = (await h('add-project', {
    moduleId: module.uuid,
    title: 'Функции',
    goal: 'Научиться создавать и использовать функции для организации кода',
    result:
      'Умеешь объявлять функции, передавать параметры и возвращать результаты',
  })) as { projects: { uuid: string; title: string }[] };
  const p3uuid = p3.projects.find((p) => p.title === 'Функции')?.uuid;
  console.log(`  ✅ Проект создан: ${p3uuid}`);

  // Урок 3.1: Основы функций
  console.log('🔄 Создаём урок "Основы функций"...');
  const l3_1 = (await h('create-lesson', {
    moduleId: module.uuid,
    projectId: p3uuid,
    title: 'Основы функций',
    additional: 'Учимся создавать свои функции',
    estimatedMinutes: 30,
  })) as { uuid: string };
  console.log(`  ✅ Урок создан: ${l3_1.uuid}`);

  await h('create-step', {
    moduleId: module.uuid,
    lessonId: l3_1.uuid,
    description: 'Объявление и вызов функции',
    kind: 'code',
    content:
      'Функция — это блок кода, который можно вызвать по имени.\n\n**Синтаксис:** function имя(параметры) { тело }',
    code: `// Объявляем функцию
function greet() {
  console.log('Привет, мир!');
}

// Вызываем функцию
greet(); // Привет, мир!
greet(); // Привет, мир! (можно вызывать много раз)

// Функция с параметрами
function sayHello(name) {
  console.log('Привет, ' + name + '!');
}

sayHello('Аня');  // Привет, Аня!
sayHello('Петя'); // Привет, Петя!`,
    language: 'javascript',
  });

  await h('create-step', {
    moduleId: module.uuid,
    lessonId: l3_1.uuid,
    description: 'Параметры и аргументы',
    kind: 'code',
    content: 'Функции могут принимать параметры и иметь значения по умолчанию.',
    code: `// Параметры по умолчанию
function power(base, exponent = 2) {
  return base ** exponent;
}

console.log(power(5));     // 25 (5²)
console.log(power(5, 3));  // 125 (5³)

// Несколько параметров
function introduce(name, age, city = 'Неизвестно') {
  console.log(
    \`Меня зовут \${name}, мне \${age} лет, я из \${city}\`
  );
}

introduce('Аня', 25, 'Москва');
// Меня зовут Аня, мне 25 лет, я из Москва`,
    language: 'javascript',
  });

  await h('create-step', {
    moduleId: module.uuid,
    lessonId: l3_1.uuid,
    description: 'return — возврат значения',
    kind: 'code',
    content:
      'Функция может вернуть результат через return. После return код не выполняется.',
    code: `// Функция возвращает результат
function add(a, b) {
  return a + b;
}

const result = add(5, 3);
console.log(result); // 8

// Можно использовать результат в других выражениях
const total = add(10, 20) * 2;
console.log(total); // 60

// Функция без return возвращает undefined
function noReturn() {
  console.log('Что-то делаю');
}
console.log(noReturn()); // undefined

// Ранний выход из функции
function divide(a, b) {
  if (b === 0) {
    return 'На ноль делить нельзя!';
  }
  return a / b;
}

console.log(divide(10, 2)); // 5
console.log(divide(10, 0)); // На ноль делить нельзя!`,
    language: 'javascript',
  });

  // Урок 3.2: Современные функции
  console.log('🔄 Создаём урок "Современные функции"...');
  const l3_2 = (await h('create-lesson', {
    moduleId: module.uuid,
    projectId: p3uuid,
    title: 'Современные функции',
    additional: 'Стрелочные функции и колбэки',
    estimatedMinutes: 25,
  })) as { uuid: string };
  console.log(`  ✅ Урок создан: ${l3_2.uuid}`);

  await h('create-step', {
    moduleId: module.uuid,
    lessonId: l3_2.uuid,
    description: 'Стрелочные функции',
    kind: 'code',
    content:
      'Стрелочные функции — более короткий синтаксис для объявления функций.\n\n**Синтаксис:** (параметры) => выражение',
    code: `// Обычная функция
function add(a, b) {
  return a + b;
}

// Стрелочная функция (аналог)
const addArrow = (a, b) => a + b;

console.log(add(5, 3));      // 8
console.log(addArrow(5, 3)); // 8

// Если параметр один — скобки можно опустить
const double = x => x * 2;
console.log(double(5)); // 10

// Если тело сложное — нужны {} и return
const max = (a, b) => {
  if (a > b) return a;
  return b;
};

console.log(max(10, 20)); // 20`,
    language: 'javascript',
  });

  await h('create-step', {
    moduleId: module.uuid,
    lessonId: l3_2.uuid,
    description: 'Callback-функции',
    kind: 'code',
    content:
      'Callback — это функция, переданная в другую функцию как аргумент.\n\nЭто основа асинхронного программирования в JS.',
    code: `// Функция принимает callback
function processUser(name, callback) {
  const message = \`Привет, \${name}!\`;
  callback(message);
}

// Передаём callback
processUser('Аня', (msg) => {
  console.log(msg.toUpperCase());
});
// ПРИВЕТ, АНЯ!

// Пример с числами
function calculate(a, b, operation) {
  return operation(a, b);
}

const sum = calculate(10, 5, (x, y) => x + y);
console.log(sum); // 15

const product = calculate(10, 5, (x, y) => x * y);
console.log(product); // 50`,
    language: 'javascript',
  });

  await h('create-step', {
    moduleId: module.uuid,
    lessonId: l3_2.uuid,
    description: 'Методы массивов с колбэками',
    kind: 'code',
    content:
      'Многие методы массивов принимают колбэки. Это делает код лаконичным.',
    code: `const numbers = [1, 2, 3, 4, 5];

// map — преобразует каждый элемент
const doubled = numbers.map(n => n * 2);
console.log(doubled); // [2, 4, 6, 8, 10]

// filter — оставляет только подходящие элементы
const evens = numbers.filter(n => n % 2 === 0);
console.log(evens); // [2, 4]

// find — находит первый подходящий элемент
const firstBig = numbers.find(n => n > 3);
console.log(firstBig); // 4

// every — все элементы соответствуют условию?
const allPositive = numbers.every(n => n > 0);
console.log(allPositive); // true

// some — хотя бы один соответствует?
const hasTen = numbers.some(n => n === 10);
console.log(hasTen); // false`,
    language: 'javascript',
  });

  // ─── 7. Проект 4: «Массивы и объекты» ────────────
  console.log('🔄 Создаём проект "Массивы и объекты"...');
  const p4 = (await h('add-project', {
    moduleId: module.uuid,
    title: 'Массивы и объекты',
    goal: 'Освоить работу с коллекциями данных — массивами и объектами',
    result: 'Умеешь создавать и управлять массивами и объектами',
  })) as { projects: { uuid: string; title: string }[] };
  const p4uuid = p4.projects.find((p) => p.title === 'Массивы и объекты')?.uuid;
  console.log(`  ✅ Проект создан: ${p4uuid}`);

  // Урок 4.1: Массивы
  console.log('🔄 Создаём урок "Массивы"...');
  const l4_1 = (await h('create-lesson', {
    moduleId: module.uuid,
    projectId: p4uuid,
    title: 'Массивы',
    additional: 'Учимся работать с упорядоченными коллекциями данных',
    estimatedMinutes: 30,
  })) as { uuid: string };
  console.log(`  ✅ Урок создан: ${l4_1.uuid}`);

  await h('create-step', {
    moduleId: module.uuid,
    lessonId: l4_1.uuid,
    description: 'Создание и доступ к элементам',
    kind: 'code',
    content:
      'Массив — упорядоченная коллекция элементов. Элементы нумеруются с 0.',
    code: `// Создание массива
const fruits = ['🍎', '🍊', '🍋'];
const numbers = [1, 2, 3, 4, 5];
const mixed = ['текст', 42, true, null];

// Доступ по индексу
console.log(fruits[0]); // 🍎
console.log(fruits[1]); // 🍊
console.log(fruits[2]); // 🍋

// Длина массива
console.log(fruits.length); // 3

// Последний элемент
console.log(fruits[fruits.length - 1]); // 🍋

// Изменение элемента
fruits[1] = '🍐';
console.log(fruits); // ['🍎', '🍐', '🍋']`,
    language: 'javascript',
  });

  await h('create-step', {
    moduleId: module.uuid,
    lessonId: l4_1.uuid,
    description: 'Основные методы массивов',
    kind: 'code',
    content: 'push/pop — добавляют/удаляют в конце. shift/unshift — в начале.',
    code: `const stack = [];

// push — добавить в конец
stack.push('a');
stack.push('b');
stack.push('c');
console.log(stack); // ['a', 'b', 'c']

// pop — удалить с конца
const last = stack.pop();
console.log(last);  // c
console.log(stack); // ['a', 'b']

// unshift — добавить в начало
stack.unshift('x');
console.log(stack); // ['x', 'a', 'b']

// shift — удалить из начала
const first = stack.shift();
console.log(first); // x
console.log(stack); // ['a', 'b']

// includes — проверяет наличие
console.log(stack.includes('a')); // true
console.log(stack.includes('z')); // false`,
    language: 'javascript',
  });

  await h('create-step', {
    moduleId: module.uuid,
    lessonId: l4_1.uuid,
    description: 'Перебор и трансформация',
    kind: 'code',
    content:
      'Современные методы для работы с массивами: forEach, map, filter, reduce.',
    code: `const numbers = [1, 2, 3, 4, 5];

// forEach — просто перебрать
numbers.forEach(n => console.log(n));
// 1, 2, 3, 4, 5

// map — создать новый массив, преобразовав каждый элемент
const squared = numbers.map(n => n ** 2);
console.log(squared); // [1, 4, 9, 16, 25]

// filter — отфильтровать
const even = numbers.filter(n => n % 2 === 0);
console.log(even); // [2, 4]

// reduce — свернуть массив в одно значение
const sum = numbers.reduce((acc, n) => acc + n, 0);
console.log(sum); // 15

// Можно комбинировать:
const result = numbers
  .filter(n => n % 2 === 1)   // [1, 3, 5]
  .map(n => n * 10)            // [10, 30, 50]
  .reduce((sum, n) => sum + n, 0); // 90
console.log(result); // 90`,
    language: 'javascript',
  });

  // Урок 4.2: Объекты
  console.log('🔄 Создаём урок "Объекты"...');
  const l4_2 = (await h('create-lesson', {
    moduleId: module.uuid,
    projectId: p4uuid,
    title: 'Объекты',
    additional: 'Учимся работать с ключ-значение структурами',
    estimatedMinutes: 30,
  })) as { uuid: string };
  console.log(`  ✅ Урок создан: ${l4_2.uuid}`);

  await h('create-step', {
    moduleId: module.uuid,
    lessonId: l4_2.uuid,
    description: 'Создание и свойства объектов',
    kind: 'code',
    content:
      'Объект — коллекция пар ключ-значение. Ключи — строки, значения — любые типы.',
    code: `// Создание объекта
const user = {
  name: 'Аня',
  age: 25,
  isStudent: true,
};

// Доступ к свойствам
console.log(user.name); // Аня (через точку)
console.log(user['age']); // 25 (через скобки)

// Изменение свойств
user.age = 26;
user['isStudent'] = false;
console.log(user); // { name: 'Аня', age: 26, isStudent: false }

// Добавление новых свойств
user.city = 'Москва';
console.log(user.city); // Москва

// Удаление свойств
delete user.isStudent;
console.log(user); // { name: 'Аня', age: 26, city: 'Москва' }`,
    language: 'javascript',
  });

  await h('create-step', {
    moduleId: module.uuid,
    lessonId: l4_2.uuid,
    description: 'Методы объектов и this',
    kind: 'code',
    content: 'Объекты могут содержать функции — они называются методами.',
    code: `const person = {
  name: 'Петя',
  age: 30,
  
  // Метод (сокращённая запись)
  sayHi() {
    console.log(\`Привет, меня зовут \${this.name}\`);
  },
  
  // Стрелочная функция — НЕ имеет своего this
  greet: () => {
    // this здесь — внешний контекст, не объект!
    console.log('greet:', this);
  },
  
  // Метод с return
  getBirthYear() {
    const currentYear = 2026;
    return currentYear - this.age;
  },
};

person.sayHi();       // Привет, меня зовут Петя
console.log(person.getBirthYear()); // 1996`,
    language: 'javascript',
  });

  await h('create-step', {
    moduleId: module.uuid,
    lessonId: l4_2.uuid,
    description: 'Деструктуризация и spread',
    kind: 'code',
    content: 'Современные возможности для работы с объектами и массивами.',
    code: `// Деструктуризация объектов
const user = { name: 'Аня', age: 25, city: 'Москва' };
const { name, age } = user;
console.log(name); // Аня
console.log(age);  // 25

// Деструктуризация с новым именем
const { name: userName, city: userCity } = user;
console.log(userName); // Аня

// Деструктуризация массивов
const colors = ['🔴', '🟢', '🔵'];
const [red, green, blue] = colors;
console.log(red);   // 🔴
console.log(green); // 🟢

// Spread — разворачивание объекта
const extendedUser = { ...user, role: 'admin' };
console.log(extendedUser);
// { name: 'Аня', age: 25, city: 'Москва', role: 'admin' }

// Spread массивов
const arr1 = [1, 2, 3];
const arr2 = [4, 5, 6];
const merged = [...arr1, ...arr2];
console.log(merged); // [1, 2, 3, 4, 5, 6]`,
    language: 'javascript',
  });

  // ─── 8. Публикуем модуль ──────────────────────────
  console.log('🔄 Публикуем модуль...');
  await h('publish-module', {
    moduleId: module.uuid,
  });
  console.log('  ✅ Модуль опубликован');

  // ─── 9. Итоги ─────────────────────────────────────
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉 Модуль "Основы JS" успешно создан!');
  console.log('UUID:', module.uuid);
  console.log('Проектов: 4, Уроков: 8, Шагов: 24');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main().catch((err) => {
  console.error('❌ Ошибка:', err);
  process.exit(1);
});
