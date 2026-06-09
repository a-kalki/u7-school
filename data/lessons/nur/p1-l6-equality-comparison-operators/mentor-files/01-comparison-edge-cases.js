console.log('=== Блок 1: Сравнение строки и числа ===');

// В реальной жизни данные из prompt() всегда строки
const userInput = '25';
const ageLimit = 18;

console.log('userInput > ageLimit =', userInput > ageLimit);

const price = '1500';
const budget = 2000;
console.log('price <= budget =', price <= budget);

console.log('');

// ============================================================

console.log('=== Блок 2: Сравнение объектов — всегда false ===');

const cart1 = { items: 3 };
const cart2 = { items: 3 };
console.log('cart1 === cart2 =', cart1 === cart2);

const copy = cart1;
console.log('cart1 === copy =', cart1 === copy);

// Практический пример:
function _checkStock(product) {
  return product === 'phone'; // так правильно
}
// Неправильно: if (product === undefined) — используй typeof или === null

console.log('');

// ============================================================

console.log('=== Блок 3: Строгий vs нестрогий — реальная ловушка ===');

// Представь: пользователь вводит 0 в поле «количество товаров»
const qty = '0'; // пришло из поля ввода

if (qty === false) {
  console.log('Товаров нет (через ==)');
}
if (qty === false) {
  console.log('Товаров нет (через ===)');
}

// А теперь число:
const count = 0;
if (count === false) {
  console.log('count == false — true');
}
if (count === false) {
  console.log('count === false — false');
}
