console.log('=== Блок 1: Приоритет && над || ===');

let a = true || false && false;
console.log('true || false && false =', a);

let b = (true || false) && false;
console.log('(true || false) && false =', b);

console.log('');

// ============================================================

console.log('=== Блок 2: Сложные выражения без скобок ===');

let c = 3 > 2 && 5 > 4 || 1 > 2;
console.log('3 > 2 && 5 > 4 || 1 > 2 =', c);

let d = 3 > 2 && (5 > 4 || 1 > 2);
console.log('3 > 2 && (5 > 4 || 1 > 2) =', d);

console.log('');

// ============================================================

console.log('=== Блок 3: Практическая ловушка ===');

let age = 25;
let hasLicense = false;

// Хочешь: «если возраст >= 18 ИЛИ есть права И машина»
// Написал так:
let canRent = age >= 18 || hasLicense && true;  // true = есть машина
console.log('age 25, no license, has car:', canRent);
let shouldRent = (age >= 18 || hasLicense) && true;
console.log('с правильными скобками:', shouldRent);
