// 01-declaration-styles.js
// Три стиля объявления функций (русские термины из видео ↔ английские)

// 1. Именованная функция (Function Declaration)
function add(a, b) {
  return a + b;
}

// 2. Анонимная функция в переменной (Function Expression)
const subtract = function (a, b) {
  return a - b;
};

// 3. Стрелочная функция (Arrow Function)
const multiply = (a, b) => {
  return a * b;
};

console.log(add(5, 3));
console.log(subtract(5, 3));
console.log(multiply(5, 3));

console.log('---');

// Стрелочная с неявным return — без фигурных скобок
const divide = (a, b) => a / b;

// Один параметр — скобки можно опустить
const square = (n) => n * n;

console.log(divide(10, 2));
console.log(square(7));

console.log('---');

// Все три стиля в одном сценарии: расчёт заказа
function calcTotal(price, qty, discount) {
  return price * qty - discount;
}

const calcTax = (total, rate) => (total * rate) / 100;

const formatReceipt = (total, tax) => `Итого: ${total + tax} ₸`;

const orderTotal = calcTotal(1500, 3, 200);
const orderTax = calcTax(orderTotal, 12);
console.log(formatReceipt(orderTotal, orderTax));
