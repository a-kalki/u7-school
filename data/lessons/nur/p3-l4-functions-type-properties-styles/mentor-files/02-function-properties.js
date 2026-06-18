// 02-function-properties.js
// Функция — это объект, может иметь собственные свойства

// typeof для функции
function greet() {
  return 'Привет';
}

console.log(typeof greet);

const a = { a: 'f' };
a.b = 'b';

console.log(a.c);

// Свойство-счётчик: сколько раз вызвали функцию
function sayHi() {
  sayHi.callCount = (sayHi.callCount || 0) + 1;
  return 'Hi';
}

sayHi();
sayHi();
sayHi();

console.log(sayHi.callCount);

// Функция-генератор ID с состоянием в свойстве
function getNextId() {
  if (getNextId.current === undefined) {
    getNextId.current = 0;
  }
  getNextId.current += 1;
  return getNextId.current;
}

console.log(getNextId());
console.log(getNextId());
console.log(getNextId());
console.log(getNextId());

// Свойство доступно снаружи — можно сбросить
getNextId.current = 100;
console.log(getNextId());
console.log(getNextId());
