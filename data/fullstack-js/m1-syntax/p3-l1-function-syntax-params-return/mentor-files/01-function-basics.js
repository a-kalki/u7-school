// 01-function-basics.js
// Объявление, вызов, параметры, return

// Простая функция — приветствие
function greet(name) {
  return `Привет, ${name}!`;
}

console.log(greet('Алия'));
console.log(greet('Данияр'));

// Функция без return — что вернёт?
function sayHello(name) {
  console.log(`Здравствуй, ${name}`);
}

const result = sayHello('Ерлан');
console.log(result);

// Функция с несколькими параметрами — форматирование цены
function formatPrice(amount, currency) {
  return `${amount} ${currency}`;
}

console.log(formatPrice(1500, '₸'));
console.log(formatPrice(25, '$'));
console.log(formatPrice(1000, '₽'));

// Функция-калькулятор: считает итоговую цену со скидкой
function getDiscountPrice(price, discountPercent) {
  const discount = (price * discountPercent) / 100;
  return price - discount;
}

console.log(getDiscountPrice(1000, 10));
console.log(getDiscountPrice(500, 20));
console.log(getDiscountPrice(2000, 0));
