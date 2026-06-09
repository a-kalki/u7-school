console.log('=== Блок 1: Приоритет && над || ===');

const a = true || (false && false);
console.log('true || false && false =', a);

const b = (true || false) && false;
console.log('(true || false) && false =', b);

console.log('');

// ============================================================

console.log('=== Блок 2: Сложные выражения без скобок ===');

const c = (3 > 2 && 5 > 4) || 1 > 2;
console.log('3 > 2 && 5 > 4 || 1 > 2 =', c);

const d = 3 > 2 && (5 > 4 || 1 > 2);
console.log('3 > 2 && (5 > 4 || 1 > 2) =', d);

console.log('');

// ============================================================

console.log('=== Блок 3: Практическая ловушка ===');

const age = 25;
const hasLicense = false;

// Хочешь: «если возраст >= 18 ИЛИ есть права И машина»
// Написал так:
const canRent = age >= 18 || (hasLicense && true); // true = есть машина
console.log('age 25, no license, has car:', canRent);
const shouldRent = (age >= 18 || hasLicense) && true;
console.log('с правильными скобками:', shouldRent);
