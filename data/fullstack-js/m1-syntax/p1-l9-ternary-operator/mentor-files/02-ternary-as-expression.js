console.log('=== Блок 1: Тернарник возвращает значение ===');

// Тернарник — это выражение (expression), он возвращает значение
const a = 10;
const b = 20;
const max = a > b ? a : b;
console.log('max =', max);

// if — это инструкция (statement), она не возвращает значение
let max2;
if (a > b) {
  max2 = a;
} else {
  max2 = b;
}
console.log('max2 =', max2);

console.log('');

// ============================================================

console.log('=== Блок 2: Тернарник внутри шаблонной строки ===');

const price = 1500;
const discount = price > 1000 ? 200 : 0;
console.log(`Цена: ${price}, скидка: ${discount}, итог: ${price - discount}`);

// А внутри тернарника — шаблонная строка:
const weather = 'sunny';
const advice =
  weather === 'rainy' ? 'Возьми зонт' : `Погода ${weather} — гуляй!`;
console.log('advice:', advice);

console.log('');

// ============================================================

console.log('=== Блок 3: Тернарник в цепочке вычислений ===');

// Можно использовать тернарник как часть более сложного выражения
const items = 5;
const shipping = items > 10 ? 0 : items > 5 ? 500 : 1000;
console.log('Доставка для', items, 'товаров:', shipping, 'тг');

// Лучше с группировкой:
const shipping2 = items > 10 ? 0 : items > 5 ? 500 : 1000;
console.log('С группировкой:', shipping2, 'тг');
