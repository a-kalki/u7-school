// Строгое vs нестрогое равенство: числа и строки
const userAge = '25';
const requiredAge = 25;

console.log('userAge === requiredAge:', userAge === requiredAge);
console.log('userAge == requiredAge:', userAge == requiredAge);

// Сравнение с falsy-значениями
console.log('0 === false:', 0 === false);
console.log('0 == false:', 0 == false);

console.log('"" === false:', '' === false);
console.log('"" == false:', '' == false);

// Пасхалка: null и undefined
console.log('null === undefined:', null === undefined);
console.log('null == undefined:', null == undefined);

// Строгое и нестрогое неравенство
const price = '1500';
console.log('price !== 1500:', price !== 1500);
console.log('price != 1500:', price != 1500);

// Реальная ситуация: проверка пустого ввода
const input = '';
console.log('input === "":', input === '');
console.log('input == false:', input == false);

// Реальная ситуация: есть ли товар на складе
const stockCount = 0;
const isOutOfStock = stockCount === 0;
console.log('isOutOfStock:', isOutOfStock);

const isAvailable = stockCount !== 0;
console.log('isAvailable:', isAvailable);
