console.log('=== Блок 1: Оператор + слева направо ===');

let a = 1 + 2 + '3';
console.log('1 + 2 + "3" =', a);
// Подсказка: операторы с одинаковым приоритетом выполняются слева направо

let b = '1' + 2 + 3;
console.log('"1" + 2 + 3 =', b);

console.log('');

// ============================================================

console.log('=== Блок 2: Арифметика с нечисловыми строками ===');

let c = '10' - '5' - 2;
console.log('"10" - "5" - 2 =', c);
// Подсказка: у минуса нет конкатенации

let d = '10' - 'hello';
console.log('"10" - "hello" =', d);

let e = '10' * 'hello';
console.log('"10" * "hello" =', e);

console.log('');

// ============================================================

console.log('=== Блок 3: NaN в реальном коде — опасность и проверка ===');

// Представь: считаем зарплату
let salary = '200000';  // строка из базы
let bonus = undefined;   // премия не назначена

let total = Number(salary) + Number(bonus);
console.log('salary + bonus =', total);

// Как проверить?
console.log('Number.isNaN(total) =', Number.isNaN(total));

if (Number.isNaN(total)) {
  console.log('Ошибка расчёта: проверьте данные сотрудника');
}

// А if (total === NaN) — сработает? Почему нет?
