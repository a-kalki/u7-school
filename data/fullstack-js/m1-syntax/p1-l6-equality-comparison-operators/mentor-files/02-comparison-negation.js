// Операторы сравнения: числа
const wallet = 5000;
const itemPrice = 7500;

console.log('wallet >= itemPrice:', wallet >= itemPrice);
console.log('wallet < itemPrice:', wallet < itemPrice);

// Сравнение строки и числа
const userBalance = '3000';
const minBalance = 2500;

console.log('userBalance > minBalance:', userBalance > minBalance);
console.log('userBalance <= minBalance:', userBalance <= minBalance);

// Сравнение строк
console.log('"apple" < "banana":', 'apple' < 'banana');
console.log('"apple" > "Banana":', 'apple' > 'Banana');

// Оператор отрицания
const isLoggedIn = true;
console.log('isLoggedIn:', isLoggedIn);
console.log('!isLoggedIn:', !isLoggedIn);

// Двойное отрицание
console.log('!!"hello":', !!'hello');
console.log('!!0:', !!0);
console.log('!!"":', !!'');

// Пасхалка: сравнение с NaN
console.log('NaN > 0:', NaN > 0);
console.log('NaN < 0:', NaN < 0);
console.log('NaN === NaN:', NaN === NaN);
