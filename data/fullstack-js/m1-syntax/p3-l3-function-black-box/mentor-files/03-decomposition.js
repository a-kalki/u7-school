// 03-decomposition.js
// Декомпозиция — разбиваем сложную задачу на маленькие функции

// Задача: посчитать зарплату «на руки» (с вычетом налогов)

// Шаг 1: посчитать ОПВ — 10% от оклада
function calcOpv(salary) {
  return Math.round(salary * 0.1);
}

// Шаг 2: посчитать ИПН — 10% от (оклад - ОПВ - МЗП)
function calcIpn(salary, opv, mzp) {
  const taxable = salary - opv - mzp;
  if (taxable < 0) {
    return 0;
  }
  return Math.round(taxable * 0.1);
}

// Шаг 3: итоговая сумма на руки
function calcNetSalary(salary) {
  const mzp = 85000;
  const opv = calcOpv(salary);
  const ipn = calcIpn(salary, opv, mzp);
  return salary - opv - ipn;
}

// Клиентский код — одна строка вызова, внутри цепочка из трёх функций
console.log(calcNetSalary(100000));
console.log(calcNetSalary(200000));
console.log(calcNetSalary(300000));
console.log(calcNetSalary(50000));
