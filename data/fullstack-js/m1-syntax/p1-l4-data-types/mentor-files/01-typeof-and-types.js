// Типы данных: практические примеры
const age = 25;
const name = 'Алия';
const isStudent = true;
let score;

console.log('typeof age:', typeof age);
console.log('typeof name:', typeof name);
console.log('typeof isStudent:', typeof isStudent);
console.log('typeof score:', typeof score);

// Типы данных: объект
const user = { name: 'Асель' };
const alphabet = ['a', 'b', 'c', 'd'];
console.log('typeof user:', typeof user);
console.log('typeof alphabet:', typeof alphabet);

// Пасхалка: typeof null
const empty = null;
console.log('typeof null:', typeof empty);

// Пасхалка: typeof NaN
const invalidCalc = 'abc' * 2;
console.log('invalidCalc =', invalidCalc);
console.log('typeof NaN:', typeof invalidCalc);

// typeof возвращает строку
const typeOfAge = typeof age;
console.log('typeOfAge:', typeOfAge);
console.log('typeof typeOfAge:', typeof typeOfAge);

// Шаблонные строки с интерполяцией
const apples = 5;
const pears = 3;
const message = `Всего фруктов: ${apples + pears}`;
console.log(message);

const pricePerApple = 120;
const totalPrice = `Стоимость: ${apples * pricePerApple} тенге`;
console.log(totalPrice);

// Типы результатов математических операций
const result1 = 10 / 3;
console.log('10 / 3 =', result1);
console.log('typeof (10 / 3):', typeof result1);

const result2 = 1 / 0;
console.log('1 / 0 =', result2);
console.log('typeof Infinity:', typeof result2);
