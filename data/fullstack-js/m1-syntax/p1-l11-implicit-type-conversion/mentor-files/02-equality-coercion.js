// Блок 1: == с числами и строками
const userAge = '18';

console.log('"18" == 18:', userAge == 18);
console.log('"18" === 18:', userAge === 18);

console.log('---');

// Блок 2: == со странными сравнениями
console.log('0 == false:', 0 == false);
console.log('0 === false:', 0 === false);

console.log('"" == false:', '' == false);
console.log('"" === false:', '' === false);

console.log('---');

// Блок 3: null и undefined
const user = null;

console.log('null == undefined:', null == undefined);
console.log('null === undefined:', null === undefined);

console.log('null == 0:', null == 0);
console.log('null == false:', null == false);

console.log('---');

// Блок 4: Реальный сценарий — проверка ввода
const input = '';

const isEmpty = input == false;
console.log('input == false:', isEmpty);

const isEmptyStrict = input === '';
console.log('input === "":', isEmptyStrict);
