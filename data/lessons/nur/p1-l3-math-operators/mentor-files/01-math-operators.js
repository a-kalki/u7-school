console.log('=== Блок 1: Последовательные операции ===');
let x = 10;
console.log('x =', x);

x = x + 5;
console.log('x = x + 5  →', x);

x = x * 3;
console.log('x = x * 3  →', x);

x = x % 4;
console.log('x = x % 4  →', x);

x = (x + 1) ** 4;
console.log('x = (x + 1) ** 4  →', x);

console.log('');

// ============================================================
console.log('=== Блок 2: Сокращённый синтаксис ===');
let y = 20;

y -= 4;
console.log('y -= 4   →', y);

y *= 3;
console.log('y *= 3   →', y);

y %= 5;
console.log('y %= 5   →', y);

console.log('');

// ============================================================
console.log('=== Блок 3: x *= x + 2 — что сначала? ===');
let a = 5;
a *= a + 2;
console.log('a *= a + 2 →', a);

let b = 10;
b -= b / 2;
console.log('b -= b / 2 →', b);
