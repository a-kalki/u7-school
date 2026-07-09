// Блок 1: Числа в условиях
if (0) {
  console.log('if(0) — не выполнится');
} else {
  console.log('if(0) — falsy, сработал else');
}

if (-1) {
  console.log('if(-1) — выполняется, любое ненулевое число truthy');
}

console.log('---');

// Блок 2: Строки в условиях
const name = 'Алия';
if (name) {
  console.log('Имя указано:', name);
}

const emptyName = '';
if (emptyName) {
} else {
  console.log('Пустая строка — falsy');
}

console.log('---');

// Блок 3: undefined и null
let city;
if (city) {
  console.log('Город указан');
} else {
  console.log('Город не указан — undefined falsy');
}

const discount = null;
if (discount) {
  console.log('Скидка есть');
} else {
  console.log('Скидки нет — null falsy');
}

console.log('---');

// Блок 4: Реальный сценарий — проверка заполнения полей
const userName = '';
const userAge = 25;

const hasName = !!userName;
const hasAge = !!userAge;

console.log('hasName:', hasName);
console.log('hasAge:', hasAge);

const canRegister = hasName && hasAge;
console.log('canRegister:', canRegister);
