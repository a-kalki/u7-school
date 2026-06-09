console.log('=== Блок 1: if без {} — ловушка ===');

const x = 10;
if (x > 5) console.log('Больше пяти');
console.log('Эта строка выполнится всегда?');

console.log('');

// ============================================================

console.log('=== Блок 2: Dangling else — какой if относится? ===');

const a = 10;
const b = 5;

if (a > 5)
  if (b > 3) console.log('a > 5 и b > 3');
  else console.log('a <= 5? или b <= 3?');

console.log('');

// ============================================================

console.log('=== Блок 3: Исправляем с {} ===');

const c = 10;
const d = 1;

if (c > 5) {
  if (d > 3) {
    console.log('c > 5 и d > 3');
  } else {
    console.log('c > 5 но d <= 3');
  }
} else {
  console.log('c <= 5');
}
