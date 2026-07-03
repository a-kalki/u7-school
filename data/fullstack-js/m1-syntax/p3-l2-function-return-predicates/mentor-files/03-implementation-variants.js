// 03-implementation-variants.js
// Одна задача — разные реализации

// Задача: посчитать сумму чисел от 1 до n

// Реализация 1 — через цикл for
function sumRangeFor(n) {
  let sum = 0;
  for (let i = 1; i <= n; i += 1) {
    sum += i;
  }
  return sum;
}

// Реализация 2 — через цикл while
function sumRangeWhile(n) {
  let sum = 0;
  let i = 1;
  while (i <= n) {
    sum += i;
    i += 1;
  }
  return sum;
}

// Реализация 3 — через формулу (без циклов)
function sumRangeFormula(n) {
  return (n * (n + 1)) / 2;
}

// Все три дают одинаковый результат
console.log(sumRangeFor(5));
console.log(sumRangeWhile(5));
console.log(sumRangeFormula(5));

console.log(sumRangeFor(10));
console.log(sumRangeWhile(10));
console.log(sumRangeFormula(10));
