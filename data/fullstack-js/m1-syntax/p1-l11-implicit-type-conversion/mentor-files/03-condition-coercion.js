// Блок 1: Число 0 — валидное значение, но falsy
const balance = 0;

if (balance) {
  console.log('1 if: баланс =', balance);
} else {
  console.log('1 else: БАГ! 0 принят за «нет значения»');
}

// Правильно: явно проверить, что значение не null/undefined
if (balance !== null && balance !== undefined) {
  console.log('1 fix: явная проверка — баланс =', balance);
}

console.log('---');

// Блок 2: Пустая строка — falsy
const userName = '';

if (userName) {
  console.log('2 if: привет,', userName);
} else {
  console.log('2 else: пустая строка — falsy');
}

console.log('---');

// Блок 3: NaN — всегда falsy
const result = Number('abc');

if (result) {
  console.log('3 if: результат =', result);
} else {
  console.log('3 else: NaN — всегда falsy');
}

console.log('---');

// Блок 4: undefined — «нет значения», здесь falsy работает правильно
let bonus;

if (bonus) {
  console.log('4 if: бонус =', bonus);
} else {
  console.log('4 else: undefined — правильно, бонуса нет');
}
