// Блок 1: Number() vs parseInt() — разное поведение
const priceStr = '1500 тг';

console.log('Number("1500 тг"):', Number('1500 тг'));
console.log('parseInt("1500 тг"):', parseInt('1500 тг', 10));

const widthStr = '100px';
console.log('Number("100px"):', Number('100px'));
console.log('parseInt("100px"):', parseInt('100px', 10));

console.log('---');

// Блок 2: String() и .toString()
const count = 42;
console.log('String(count):', String(count));
console.log('count.toString():', count.toString());

const isActive = true;
console.log('String(true):', String(isActive));
console.log('true.toString():', isActive.toString());

console.log('---');

// Блок 3: Унарный + и parseFloat
const strPrice = '1499.99';
console.log('+strPrice:', +strPrice);
console.log('parseFloat(strPrice):', parseFloat(strPrice));

console.log('---');

// Блок 4: Проверка на NaN после приведения
const userInput = 'abc';
const parsed = Number(userInput);
console.log('Number("abc"):', parsed);
console.log('Number.isNaN(parsed):', Number.isNaN(parsed));
