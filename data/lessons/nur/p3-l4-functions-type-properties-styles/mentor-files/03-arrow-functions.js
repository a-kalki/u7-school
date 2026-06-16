// 03-arrow-functions.js
// Стрелочные функции — краткий синтаксис

// Классическая функция
function addClassic(a, b) {
  return a + b;
}

// Стрелочная с телом (фигурные скобки + return)
const addArrow = (a, b) => {
  return a + b;
};

// Стрелочная с неявным return (без фигурных скобок)
const addShort = (a, b) => a + b;

console.log(addClassic(3, 7));
console.log(addArrow(3, 7));
console.log(addShort(3, 7));

// Один параметр — скобки можно опустить
const greet = (name) => `Сәлем, ${name}!`;
console.log(greet('Айжан'));
console.log(greet('Данияр'));

// Без параметров — пустые скобки обязательны
const getYear = () => 2026;
console.log(getYear());

// Стрелочная с телом из нескольких строк
const getDiscountLabel = (price, percent) => {
  const discount = Math.round((price * percent) / 100);
  const final = price - discount;
  return `Цена: ${price} → скидка ${percent}% = ${final} ₸`;
};

console.log(getDiscountLabel(5000, 20));
console.log(getDiscountLabel(12000, 10));
