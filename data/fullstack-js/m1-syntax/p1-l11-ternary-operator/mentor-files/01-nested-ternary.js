// Блок 1: Вложенные тернарники — когнитивная нагрузка
const score = 85;
const grade = score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 50 ? 'C' : 'D';
console.log('Оценка при score = 85:', grade);

// Та же логика через if-else:
let gradeIf;
if (score >= 90) {
  gradeIf = 'A';
} else if (score >= 75) {
  gradeIf = 'B';
} else if (score >= 50) {
  gradeIf = 'C';
} else {
  gradeIf = 'D';
}
console.log('Та же логика через if-else:', gradeIf);

console.log('---');

// Блок 2: Тернарник без else — ошибка
const age = 20;
const status = age >= 18 ? 'Взрослый' : 'Несовершеннолетний';
console.log('status:', status);

console.log('---');

// Блок 3: Приоритет операторов — тернарник vs сложение
const a = 5;
const b = 10;
const result = a > b ? a + b : a - b;
console.log('a > b ? a + b : a - b =', result);

// Пасхалка: сложение выполняется раньше тернарника
const val = 5;
const msg = 'Число: ' + val > 0 ? 'положительное' : 'отрицательное';
console.log('msg:', msg);

const msgFixed = 'Число: ' + (val > 0 ? 'положительное' : 'отрицательное');
console.log('msgFixed:', msgFixed);

console.log('---');

// Блок 4: Тернарник с несколькими условиями
const temp = 10;
const weather =
  temp < 0
    ? 'Холодно'
    : temp < 15
      ? 'Прохладно'
      : temp < 25
        ? 'Тепло'
        : 'Жарко';
console.log('Погода:', weather);
