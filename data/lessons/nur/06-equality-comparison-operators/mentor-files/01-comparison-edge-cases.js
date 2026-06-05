console.log('=== Блок 1: Сравнение строки и числа ===');

// В реальной жизни данные из prompt() всегда строки
let userInput = '25';
let ageLimit = 18;

console.log('userInput > ageLimit =', userInput > ageLimit);
// ? userInput — строка '25', ageLimit — число 18. JS приводит строку к числу. Что будет?

let price = '1500';
let budget = 2000;
console.log('price <= budget =', price <= budget);
// ? Сравнение строки и числа — работает, но лучше явно приводить Number()

console.log('');

// ============================================================

console.log('=== Блок 2: Сравнение объектов — всегда false ===');

let cart1 = { items: 3 };
let cart2 = { items: 3 };
console.log('cart1 === cart2 =', cart1 === cart2);
// ? Два одинаковых объекта — но это разные объекты в памяти. Сравнение даёт false

let copy = cart1;
console.log('cart1 === copy =', cart1 === copy);
// ? А здесь true — потому что это ссылка на один и тот же объект

// Практический пример:
function checkStock(product) {
  return product === 'phone';  // так правильно
}
// Неправильно: if (product === undefined) — используй typeof или === null

console.log('');

// ============================================================

console.log('=== Блок 3: Строгий vs нестрогий — реальная ловушка ===');

// Представь: пользователь вводит 0 в поле «количество товаров»
let qty = '0';  // пришло из поля ввода

if (qty == false) {
  console.log('Товаров нет (через ==)');  // это выполнится!
}
if (qty === false) {
  console.log('Товаров нет (через ===)');  // не выполнится — типы разные
}

// А теперь число:
let count = 0;
if (count == false) {
  console.log('count == false — true');   // тоже выполнится
}
if (count === false) {
  console.log('count === false — false'); // не выполнится
}

console.log('Вывод: === всегда проверяет и значение, и тип. Используй только ===.');
