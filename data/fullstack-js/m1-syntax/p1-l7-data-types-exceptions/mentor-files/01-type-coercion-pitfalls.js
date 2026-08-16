// Ситуация: данные пользователя из формы — всегда строки
const ageInput = '25';
const year = 1;

const nextAge = ageInput + year;
console.log('nextAge =', nextAge);

const nextAgeFixed = ageInput - -year;
console.log('nextAgeFixed =', nextAgeFixed);

// Ситуация: складской учёт
const inStock = '50';
const sold = 20;

const remaining = inStock - sold;
console.log('remaining =', remaining);

const restock = inStock + sold;
console.log('restock =', restock);

// Исключение: вызов метода на числе
const score = 100;
console.log('typeof score =', typeof score);

// Раскомментируй строку ниже и проверь, что произойдёт
// const shout = score.toUpperCase();

// Исключение останавливает поток выполнения
console.log('1. Код до исключения');

// Раскомментируй строку ниже и проверь
// 'hello'.toFixed(2);

console.log('2. Код после исключения');

// NaN распространяется в вычислениях
const badValue = 'abc' - 5;
console.log('badValue =', badValue);

const tax = badValue * 0.12;
console.log('tax =', tax);

const total = badValue + 100;
console.log('total =', total);
