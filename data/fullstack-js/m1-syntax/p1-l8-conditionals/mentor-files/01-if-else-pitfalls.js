// Блок 1: if без {} — только первая строка под if
const temperature = 15;

if (temperature > 20) console.log('Тепло');
console.log('Надевай футболку');

console.log('---');

// Блок 2: Dangling else — к какому if относится?
const age = 20;
const hasTicket = false;

if (age >= 18)
  if (hasTicket) console.log('Проходите');
  else console.log('Билета нет или возраст?');

console.log('---');

// Блок 3: Исправляем c {}
const age2 = 20;
const hasTicket2 = false;

if (age2 >= 18) {
  if (hasTicket2) {
    console.log('Проходите');
  } else {
    console.log('Возраст есть, но билета нет');
  }
} else {
  console.log('Нет 18 лет');
}

console.log('---');

// Блок 4: Ловушка = вместо ===
let score = 0;

if (score === 10) {
  console.log('Отлично');
} else {
  console.log('Не отлично');
}

if ((score = 10)) {
  console.log('После присваивания');
}
console.log('score теперь:', score);
