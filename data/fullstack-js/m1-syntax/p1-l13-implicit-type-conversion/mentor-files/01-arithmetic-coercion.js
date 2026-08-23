// Блок 1: + со строкой — конкатенация
const price1 = 1000;
const price2 = '500';

console.log('price1 + price2:', price1 + price2);
console.log('typeof (price1 + price2):', typeof (price1 + price2));

const correctTotal = price1 + Number(price2);
console.log('price1 + Number(price2):', correctTotal);

console.log('---');

// Блок 2: -, *, / — всегда приводят к числу
const a = '10';
const b = '5';

console.log('"10" - "5":', a - b);
console.log('"10" * "5":', a * b);
console.log('"10" / "5":', a / b);

const c = '20';
const d = 4;
console.log('"20" % 4:', c % d);

console.log('---');

// Блок 3: Нечисловая строка даёт NaN
const bad = 'abc';
console.log('"abc" - 1:', bad - 1);
console.log('"abc" * 2:', bad * 2);

console.log('---');

// Блок 4: Пасхалка — порядок слева направо
const result1 = 1 + 2 + '3';
console.log('1 + 2 + "3":', result1);

const result2 = '1' + 2 + 3;
console.log('"1" + 2 + 3:', result2);

const result3 = 1 + '2' + 3;
console.log('1 + "2" + 3:', result3);
