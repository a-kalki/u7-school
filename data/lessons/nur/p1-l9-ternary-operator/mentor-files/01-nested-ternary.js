console.log('=== Блок 1: Вложенные тернарники — когнитивная нагрузка ===');

let score = 85;
let grade = score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 50 ? 'C' : 'D';
console.log('Оценка при score = 85:', grade);

// Сравни с if-else:
let grade2;
if (score >= 90) {
  grade2 = 'A';
} else if (score >= 75) {
  grade2 = 'B';
} else if (score >= 50) {
  grade2 = 'C';
} else {
  grade2 = 'D';
}
console.log('Та же логика через if-else:', grade2);

console.log('');

// ============================================================

console.log('=== Блок 2: Тернарник без else — ошибка ===');

// let result = age > 18 ? 'Взрослый';

let age = 20;
let status = age >= 18 ? 'Взрослый' : 'Несовершеннолетний';
console.log('status:', status);
// ? А if может быть без else. Почему тернарник — нет?

console.log('');

// ============================================================

console.log('=== Блок 3: Тернарник и приоритет операторов ===');

let x = 5;
let y = 10;
let result = x > y ? x + y : x - y;
console.log('x > y ? x + y : x - y =', result);

// А теперь попробуй:
let val = 5;
let msg = 'Число: ' + val > 0 ? 'положительное' : 'отрицательное';
console.log(msg);
// Подсказка: + имеет более высокий приоритет, чем ?
