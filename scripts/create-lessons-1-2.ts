/**
 * Скрипт: Уроки 1–2 Проекта 1 модуля «Основы JS»
 *
 * Создаёт:
 *   Урок 1 — Введение в программирование, Переменные (6 шагов)
 *   Урок 2 — Математические операторы, Типы данных (6 шагов)
 *
 * Запуск: bun run scripts/create-lessons-1-2.ts
 */

import { CourseApiModule } from '../packages/course/src/api/module.ts';
import { LessonJsonRepo } from '../packages/course/src/infra/db/lesson-json-repo.ts';
import { ModuleJsonRepo } from '../packages/course/src/infra/db/module-json-repo.ts';
import { StepJsonRepo } from '../packages/course/src/infra/db/step-json-repo.ts';
import { UserApiModule } from '../packages/user/src/api/index.ts';
import { UserJsonRepo } from '../packages/user/src/infra/db/user-json-repo.ts';
import { UserInProcFacade } from '../packages/user/src/infra/user-in-proc-facade.ts';

const NUR_UUID = '8d9a56f6-51e7-49f0-ba58-2832b157e718';
const MODULE_UUID = 'e4dea4fc-f8db-4b19-be2d-59fcf3ad96fa';
const PROJECT1_UUID = 'a1995ea3-1e8b-4cff-bc0c-bd19ff81acbe';

async function main() {
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
    courseApi.handle({ name, attrs, actorId: NUR_UUID }) as Promise<
      Record<string, unknown>
    >;

  // ────────────────────────────────────────────────
  // Урок 1 — Введение в программирование, Переменные
  // ────────────────────────────────────────────────
  console.log('🔄 Урок 1: Введение в программирование, Переменные...');
  const l1 = (await h('create-lesson', {
    moduleId: MODULE_UUID,
    projectId: PROJECT1_UUID,
    title: 'Введение в программирование, Переменные',
    additional:
      'Что такое программирование, JS, console, переменные let и const',
    estimatedMinutes: 35,
  })) as unknown as { uuid: string };
  console.log(`  ✅ Урок 1 создан: ${l1.uuid}`);

  // Шаг 1.1 — Видео
  await h('create-step', {
    moduleId: MODULE_UUID,
    lessonId: l1.uuid,
    description: '🎥 Видео: Введение в программирование и переменные',
    kind: 'text',
    content:
      'Посмотри видео, где я прямо в браузерной консоли показываю:\n\n' +
      '— Что такое программирование и зачем нужен JavaScript\n' +
      '— Как открыть консоль в браузере (F12 → Console)\n' +
      '— Что такое переменная и зачем она нужна\n' +
      '— Объявление переменных через let и const\n' +
      '— Разница между let и const\n' +
      '— Правила именования переменных\n\n' +
      'Открой консоль браузера (F12 → Console) и повторяй за видео.',
  });
  console.log('  ✅ Шаг 1.1: Видео');

  // Шаг 1.2 — Выражение в консоли
  await h('create-step', {
    moduleId: MODULE_UUID,
    lessonId: l1.uuid,
    description: '💻 Выражение в консоли',
    kind: 'code',
    content: 'Набери в консоли браузера эти команды и посмотри, что получится:',
    code: `// Простое выражение
console.log('Привет, мир!');

// Математическое выражение
console.log(2 + 3);

// Что будет, если написать просто число?
42;

// А если строку?
'Привет';`,
    language: 'javascript',
  });
  console.log('  ✅ Шаг 1.2: Выражение в консоли');

  // Шаг 1.3 — let и const
  await h('create-step', {
    moduleId: MODULE_UUID,
    lessonId: l1.uuid,
    description: '💻 Объявление переменных let и const',
    kind: 'code',
    content:
      'Объяви переменные с помощью let и const и посмотри, как они ведут себя в консоли:',
    code: `// let — можно изменить
let myName = 'Аня';
console.log(myName);

myName = 'Петя'; // Перезаписываем
console.log(myName);

// const — нельзя изменить
const birthYear = 1990;
console.log(birthYear);

// Попробуй перезаписать:
// birthYear = 2000; // 🔥 Ошибка! Раскомментируй и проверь`,
    language: 'javascript',
  });
  console.log('  ✅ Шаг 1.3: let и const');

  // Шаг 1.4 — Присваивание
  await h('create-step', {
    moduleId: MODULE_UUID,
    lessonId: l1.uuid,
    description: '💻 Присваивание и перезапись значений',
    kind: 'code',
    content:
      'Поэкспериментируй: объявляй переменные, присваивай им новые значения, используй одну переменную в вычислениях другой:',
    code: `let x = 10;
let y = 20;

// Присваиваем новое значение на основе другого
let sum = x + y;
console.log('Сумма:', sum);

// Перезаписываем
x = 50;
sum = x + y;
console.log('Новая сумма:', sum);

// Можно присвоить переменной значение другой переменной
let a = 5;
let b = a;
console.log('b равно a:', b);

a = 100;
console.log('a изменилось:', a);
console.log('b осталось тем же:', b);`,
    language: 'javascript',
  });
  console.log('  ✅ Шаг 1.4: Присваивание');

  // Шаг 1.5 — Именование
  await h('create-step', {
    moduleId: MODULE_UUID,
    lessonId: l1.uuid,
    description: '💻 Именование переменных — правила и соглашения',
    kind: 'code',
    content:
      'В JavaScript есть правила именования переменных. Попробуй разные варианты в консоли:',
    code: `// ✅ Правильные имена
let userName = 'Аня';          // camelCase — стандарт в JS
let user_name = 'Петя';       // snake_case — тоже можно, но реже
let $ = 'доллар';              // $ разрешён
let _private = 'секрет';      // _ разрешён
let user1 = 'пользователь';   // можно с цифрой в конце

// ❌ Неправильные имена (раскомментируй и проверь)
// let 1user = 'ошибка';       // Нельзя начинать с цифры
// let my-var = 'ошибка';      // Дефис — это минус!
// let let = 'ошибка';         // Зарезервированное слово

// 🔥 Практика: придумай осмысленное имя
const MAX_SCORE = 100;         // Константы — UPPER_SNAKE_CASE
let playerScore = 75;          // Обычные переменные — camelCase`,
    language: 'javascript',
  });
  console.log('  ✅ Шаг 1.5: Именование');

  // Шаг 1.6 — Что будет если
  await h('create-step', {
    moduleId: MODULE_UUID,
    lessonId: l1.uuid,
    description: '💻 Что будет если: обратиться к необъявленной переменной?',
    kind: 'code',
    content:
      'А что будет, если попробовать прочитать переменную, которую ты не объявлял? Набери и проверь:',
    code: `// Попробуй набрать в консоли это:
console.log(notDeclaredVariable);

// ❓ Какую ошибку ты видишь? Что она означает?

// А теперь попробуй это:
let declaredVariable = 42;
console.log(declaredVariable);

// ❓ А теперь? Разница есть?

// Бонус: что будет с var?
var oldWay = 'так писали раньше';
console.log(oldWay);

// ❓ Чем var отличается от let? (поэкспериментируй)`,
    language: 'javascript',
  });
  console.log('  ✅ Шаг 1.6: Что будет если');

  // ────────────────────────────────────────────────
  // Урок 2 — Математические операторы, Типы данных
  // ────────────────────────────────────────────────
  console.log('\n🔄 Урок 2: Математические операторы, Типы данных...');
  const l2 = (await h('create-lesson', {
    moduleId: MODULE_UUID,
    projectId: PROJECT1_UUID,
    title: 'Математические операторы, Типы данных',
    additional: 'Арифметика, number, string, boolean, null, undefined, typeof',
    estimatedMinutes: 40,
  })) as unknown as { uuid: string };
  console.log(`  ✅ Урок 2 создан: ${l2.uuid}`);

  // Шаг 2.1 — Видео
  await h('create-step', {
    moduleId: MODULE_UUID,
    lessonId: l2.uuid,
    description: '🎥 Видео: Математические операторы и типы данных',
    kind: 'text',
    content:
      'Посмотри видео, где я в консоли показываю:\n\n' +
      '— Арифметические операторы: +, -, *, /, %, **\n' +
      '— Типы данных: number, string, boolean, null, undefined\n' +
      '— Оператор typeof — узнать тип значения\n' +
      '— Конкатенация строк\n' +
      '— Шаблонные строки (template literals)\n\n' +
      'Открой консоль и повторяй все примеры за видео.',
  });
  console.log('  ✅ Шаг 2.1: Видео');

  // Шаг 2.2 — Арифметика
  await h('create-step', {
    moduleId: MODULE_UUID,
    lessonId: l2.uuid,
    description: '💻 Арифметика в консоли',
    kind: 'code',
    content:
      'Набери каждое выражение в консоли и убедись, что понимаешь результат:',
    code: `// Сложение
console.log(10 + 5);     // ?

// Вычитание
console.log(10 - 5);     // ?

// Умножение
console.log(10 * 5);     // ?

// Деление
console.log(10 / 3);     // ? (обрати внимание на дробную часть)

// Остаток от деления
console.log(10 % 3);     // ? (сколько осталось?)
console.log(10 % 2);     // ?
console.log(11 % 2);     // ? (пригодится для проверки на чётность)

// Возведение в степень
console.log(2 ** 3);     // ? (2 × 2 × 2)
console.log(10 ** 2);    // ?`,
    language: 'javascript',
  });
  console.log('  ✅ Шаг 2.2: Арифметика');

  // Шаг 2.3 — Конкатенация
  await h('create-step', {
    moduleId: MODULE_UUID,
    lessonId: l2.uuid,
    description: '💻 Конкатенация строк',
    kind: 'code',
    content: 'Строки можно склеивать (конкатенировать) оператором +. Попробуй:',
    code: `// Простая конкатенация
console.log('Hello' + ' ' + 'World');

// С числами — будь внимателен!
console.log('5' + 3);     // ? (строка + число = ?)
console.log(5 + '3');     // ?
console.log('Hello' + 42);// ?

// А что с минусом?
console.log('5' - 3);     // ? (строка - число = ?)
console.log('10' - '5');  // ?

// Как думаешь, почему минус работает иначе, чем плюс? 🤔`,
    language: 'javascript',
  });
  console.log('  ✅ Шаг 2.3: Конкатенация');

  // Шаг 2.4 — Шаблонные строки
  await h('create-step', {
    moduleId: MODULE_UUID,
    lessonId: l2.uuid,
    description: '💻 Шаблонные строки (template literals)',
    kind: 'code',
    content:
      'Шаблонные строки — современный способ встраивать переменные в строку. Используются обратные кавычки `` ` `` и ${}:',
    code: `const name = 'Аня';
const age = 25;
const city = 'Москва';

// Старый способ (конкатенация)
console.log('Меня зовут ' + name + ', мне ' + age + ' лет, я из ' + city);

// Новый способ (шаблонная строка)
console.log(\`Меня зовут \${name}, мне \${age} лет, я из \${city}\`);

// В шаблонных строках можно делать вычисления
console.log(\`Через 5 лет мне будет \${age + 5}\`);

// И даже вызывать функции
console.log(\`Моё имя в верхнем регистре: \${name.toUpperCase()}\`);`,
    language: 'javascript',
  });
  console.log('  ✅ Шаг 2.4: Шаблонные строки');

  // Шаг 2.5 — typeof
  await h('create-step', {
    moduleId: MODULE_UUID,
    lessonId: l2.uuid,
    description: '💻 Оператор typeof',
    kind: 'code',
    content:
      'typeof — это оператор, который возвращает тип значения. Проверь типы разных значений:',
    code: `// Числа
console.log(typeof 42);          // ?
console.log(typeof 3.14);        // ?
console.log(typeof NaN);         // ? (NaN — Not a Number, а тип?)

// Строки
console.log(typeof 'Привет');    // ?
console.log(typeof \`шаблон\`);   // ?

// Булевы
console.log(typeof true);        // ?
console.log(typeof false);       // ?

// Особые значения
console.log(typeof undefined);   // ?
console.log(typeof null);        // ? 🧐 (это известный баг JS!)

// Массивы и объекты
console.log(typeof [1, 2, 3]);   // ?
console.log(typeof { name: 'Аня' }); // ?

// Функции
console.log(typeof function(){}); // ?`,
    language: 'javascript',
  });
  console.log('  ✅ Шаг 2.5: typeof');

  // Шаг 2.6 — Что будет если
  await h('create-step', {
    moduleId: MODULE_UUID,
    lessonId: l2.uuid,
    description: '💻 Что будет если: "5" + 3 и "5" - 3',
    kind: 'code',
    content:
      'Классический вопрос на понимание JS. Набери и посмотри, что получится. А потом подумай — почему так?',
    code: `// Задание 1: попробуй угадать результат, а потом проверь
console.log('5' + 3);
// ❓ Твой прогноз: _______
// ❓ Реальный результат: _______
// ❓ Почему так? (подсказка: + для строк — конкатенация)

// Задание 2:
console.log('5' - 3);
// ❓ Твой прогноз: _______
// ❓ Реальный результат: _______
// ❓ Почему минус не конкатенирует?

// Задание 3:
console.log('5' * '3');
// ❓ Прогноз: _______

// Задание 4:
console.log('Hello' - 'World');
// ❓ Прогноз: _______
// ❓ Что за результат? (подсказка: NaN — Not a Number)

// Вывод: будь внимателен с типами данных!`,
    language: 'javascript',
  });
  console.log('  ✅ Шаг 2.6: Что будет если');

  // ─── Итоги ──────────────────────────────────────
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉 Уроки 1–2 созданы!');
  console.log(`  Урок 1: ${l1.uuid} — 6 шагов`);
  console.log(`  Урок 2: ${l2.uuid} — 6 шагов`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main().catch((err) => {
  console.error('❌ Ошибка:', err);
  process.exit(1);
});
