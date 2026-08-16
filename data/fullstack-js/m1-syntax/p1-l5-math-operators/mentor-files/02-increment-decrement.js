console.log('=== Блок 1: Префикс ===');
let a = 5;
console.log('++a  →', ++a);
console.log('a после =', a);

console.log('');

// ============================================================
console.log('=== Блок 2: Постфикс ===');
let b = 5;
console.log('b++  →', b++);
console.log('b после =', b);

console.log('');

// ============================================================
console.log('=== Блок 3: В выражениях ===');
let m = 2;
const n = ++m + 3;
console.log('m =', m, ', n =', n);

let p = 2;
const q = p++ + 3;
console.log('p =', p, ', q =', q);

console.log('');

// ============================================================
console.log('=== Блок 4: Сложное выражение — когнитивная нагрузка ===');
let x = 3;
let y = 5;
const r = ++x + y-- - --x + y++;
console.log('x =', x, ', y =', y, ', r =', r);

console.log('');
console.log('=== А теперь читаемая альтернатива ===');
// Та же логика — но по шагам. Что проще понять?
x = 3;
y = 5;
++x;
const s1 = x;
const s2 = y;
y--;
--x;
const s3 = x;
const s4 = y;
y++;
const result = s1 + s2 - s3 + s4;
console.log('Результат:', result);
