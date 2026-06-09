console.log('=== Блок 1: Оператор + слева направо ===');

const a = `${1 + 2}3`;
console.log('1 + 2 + "3" =', a);
// Подсказка: операторы с одинаковым приоритетом выполняются слева направо

const b = `1${2}${3}`;
console.log('"1" + 2 + 3 =', b);

console.log('');

// ============================================================

console.log('=== Блок 2: Арифметика с нечисловыми строками ===');

const c = '10' - '5' - 2;
console.log('"10" - "5" - 2 =', c);
// Подсказка: у минуса нет конкатенации

const d = '10' - 'hello';
console.log('"10" - "hello" =', d);

const e = '10' * 'hello';
console.log('"10" * "hello" =', e);

console.log('');

// ============================================================

console.log('=== Блок 3: NaN в реальном коде — опасность и проверка ===');

// Представь: считаем зарплату
const salary = '200000'; // строка из базы
let bonus; // премия не назначена

const total = Number(salary) + Number(bonus);
console.log('salary + bonus =', total);

// Как проверить?
console.log('Number.isNaN(total) =', Number.isNaN(total));

if (Number.isNaN(total)) {
  console.log('Ошибка расчёта: проверьте данные сотрудника');
}

// А if (total === NaN) — сработает? Почему нет?
