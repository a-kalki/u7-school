// 02-predicates.js
// Предикаты — функции, возвращающие true/false

// Проверка типа: isString, isNumber
function isString(value) {
  return typeof value === 'string';
}

function isNumber(value) {
  return typeof value === 'number';
}

console.log(isString('Hello'));
console.log(isString(42));
console.log(isNumber(100));
console.log(isNumber('100'));

// Бизнес-логика: может ли пользователь получить кредит
function canGetCredit(age, hasJob) {
  return age >= 21 && hasJob === true;
}

console.log(canGetCredit(25, true));
console.log(canGetCredit(20, true));
console.log(canGetCredit(30, false));

// Проверка надёжности пароля: длина >= 8
function isStrongPassword(password) {
  if (!isString(password)) {
    return false;
  }
  return password.length >= 8;
}

console.log(isStrongPassword('qwerty'));
console.log(isStrongPassword('qwerty123'));
console.log(isStrongPassword(12345678));
