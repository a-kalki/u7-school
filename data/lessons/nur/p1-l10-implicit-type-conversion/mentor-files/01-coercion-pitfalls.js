console.log('=== Блок 1: + склеивает числа, если первая строка ===');

// Реальный пример: расчёт суммы в корзине
let price1 = 1000;
let price2 = '500';  // пришло из базы как строка

console.log('price1 + price2 =', price1 + price2);

let total = price1 + Number(price2);
console.log('Исправлено: price1 + Number(price2) =', total);

console.log('');

// ============================================================

console.log('=== Блок 2: -, *, / — всегда числа ===');

let a = '10';
let b = '5';
console.log('"10" - "5" =', a - b);

console.log('"10" * "5" =', a * b);
console.log('"10" / "5" =', a / b);

// А если строка не число?
let c = 'abc';
console.log('"abc" * 1 =', c * 1);

console.log('');

// ============================================================

console.log('=== Блок 3: truthy/falsy в реальных проверках ===');

// Проверка: есть ли товары в корзине?
let cart = [];  // пустая корзина
if (cart) {
  console.log('Корзина не пуста');
} else {
  console.log('Корзина пуста');
}

// Проверка: есть ли скидка?
let discount = 0;  // скидка 0% — нет скидки
if (discount) {
  console.log('Скидка есть');
} else {
  console.log('Скидки нет');
}
