console.log('=== Блок 1: toUpperCase на разных типах ===');

let str = 'hello';
console.log('строка:', str.toUpperCase());

let num = 123;
// console.log(num.toUpperCase());

let val = null;
// console.log(val.toUpperCase());

console.log('');

// ============================================================

console.log('=== Блок 2: Остановка потока выполнения ===');

console.log('1 — До ошибки');
console.log('2 — Ещё до ошибки');
// console.log(num.toUpperCase());  // раскомментируй — поток остановится
console.log('3 — После ошибки');

console.log('');

// ============================================================

console.log('=== Блок 3: Самостоятельная проверка — другие методы ===');

let word = 'JavaScript';
// ? Вызови word.toLowerCase(), word.length, word[0]
// ? Теперь сделай то же самое с числом 2024
// ? Какие методы работают с числами? Какие нет?
// ? Вывод: у каждого типа свой набор методов
