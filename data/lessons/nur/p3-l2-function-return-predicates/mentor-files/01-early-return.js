// 01-early-return.js
// Досрочный выход из функции — валидация и guard clauses

// Без валидации — может сломаться
function getFullName(first, last) {
  return first + ' ' + last;
}

console.log(getFullName('Нурсултан', 'Назарбаев'));
console.log(getFullName('', 'Сериков'));

// С валидацией — досрочный выход (guard clause)
function getFullNameSafe(first, last) {
  if (first === '' || last === '') {
    return 'Имя не указано';
  }
  return first + ' ' + last;
}

console.log(getFullNameSafe('Айжан', 'Тулегенова'));
console.log(getFullNameSafe('', 'Сериков'));
console.log(getFullNameSafe('Ерлан', ''));

// Расчёт бонуса: отрицательные значения не имеют смысла
function calculateBonus(salary, bonusPercent) {
  if (salary <= 0 || bonusPercent < 0) {
    return 0;
  }
  return Math.round((salary * bonusPercent) / 100);
}

console.log(calculateBonus(200000, 10));
console.log(calculateBonus(0, 10));
console.log(calculateBonus(200000, -5));
console.log(calculateBonus(150000, 15));
