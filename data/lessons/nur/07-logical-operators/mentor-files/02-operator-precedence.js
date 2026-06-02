console.log('=== Блок 1: Приоритет && над || ===');

let a = true || false && false;
console.log('true || false && false =', a);
// ? && выполняется раньше ||. Значит: true || (false && false) = true || false = true
// ? Если бы || был первым: (true || false) && false = true && false = false

let b = (true || false) && false;
console.log('(true || false) && false =', b);
// ? Скобки меняют порядок. Результат другой!

console.log('');

// ============================================================

console.log('=== Блок 2: Сложные выражения без скобок ===');

let c = 3 > 2 && 5 > 4 || 1 > 2;
console.log('3 > 2 && 5 > 4 || 1 > 2 =', c);
// ? Шаг 1: 3>2 = true, 5>4 = true, 1>2 = false
// ? Шаг 2: true && true = true
// ? Шаг 3: true || false = true
// ? Попроси студента разложить по шагам

let d = 3 > 2 && (5 > 4 || 1 > 2);
console.log('3 > 2 && (5 > 4 || 1 > 2) =', d);
// ? А здесь? Скобки меняют результат?
// ? (5>4 || 1>2) = true || false = true
// ? true && true = true
// ? В этом примере результат не изменился. Но так бывает не всегда!

console.log('');

// ============================================================

console.log('=== Блок 3: Практическая ловушка ===');

let age = 25;
let hasLicense = false;

// Хочешь: «если возраст >= 18 ИЛИ есть права И машина»
// Написал так:
let canRent = age >= 18 || hasLicense && true;  // true = есть машина
console.log('age 25, no license, has car:', canRent);
// ? && выше ||, поэтому: age >= 18 || (hasLicense && true)
// ? Это даёт true, хотя прав нет! А нужно было:
let shouldRent = (age >= 18 || hasLicense) && true;
console.log('с правильными скобками:', shouldRent);
// ? Разница есть! Всегда используй скобки для сложных выражений.
