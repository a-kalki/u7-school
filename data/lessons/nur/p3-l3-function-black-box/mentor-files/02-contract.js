// 02-contract.js
// Контракт функции — обещание, вход, результат

// Контракт: принимает число, возвращает квадрат
function square(n) {
  return n * n;
}

// Клиент соблюдает контракт — передаёт число
console.log(square(5));
console.log(square(12));

// Клиент НЕ соблюдает контракт — передаёт не число
console.log(square('5'));
console.log(square('abc'));

// Функция с защитой контракта — валидация входа
function safeDivide(a, b) {
  if (b === 0) {
    return 0;
  }
  return a / b;
}

console.log(safeDivide(10, 2));
console.log(safeDivide(10, 0));
console.log(safeDivide(7, 3));

// Контракт с бизнес-логикой: можно ли получить скидку
// Вход: сумма покупки, постоянный ли клиент
// Выход: true/false (предикат)
function canGetDiscount(amount, isRegular) {
  if (typeof amount !== 'number' || amount < 0) {
    return false;
  }
  return amount >= 5000 || isRegular === true;
}

console.log(canGetDiscount(6000, false));
console.log(canGetDiscount(3000, true));
console.log(canGetDiscount(3000, false));
console.log(canGetDiscount(-100, true));
