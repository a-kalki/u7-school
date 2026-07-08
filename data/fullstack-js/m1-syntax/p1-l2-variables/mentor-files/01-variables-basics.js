console.log('=== Блок 1: let ===');
let city = 'Алматы';
console.log('city =', city);

city = 'Астана';
console.log('city после =', city);

console.log('');

// ============================================================
console.log('=== Блок 2: const ===');
let birthYear = 2000;
console.log('birthYear =', birthYear);

birthYear = 2001;
console.log('birthYear после =', birthYear);

console.log('');

// ============================================================
console.log('=== Блок 3: undefined ===');
let message;
console.log('message =', message);

message = 'Значение можно присвоить позже';
console.log('message =', message);

console.log('');

// ============================================================
console.log('=== блок 4: переприсваивание между переменными ===');
let a = 10;
const b = a;
console.log('a =', a);
console.log('b =', b);

a = 20;
console.log('a после =', a);
console.log('b после =', b);
