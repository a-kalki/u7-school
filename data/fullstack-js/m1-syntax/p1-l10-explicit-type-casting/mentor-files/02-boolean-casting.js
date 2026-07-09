// Блок 1: Boolean() для разных типов
console.log('Boolean(1):', Boolean(1));
console.log('Boolean(0):', Boolean(0));
console.log('Boolean("hello"):', Boolean('hello'));
console.log('Boolean(""):', Boolean(''));

console.log('Boolean(null):', Boolean(null));
console.log('Boolean(NaN):', Boolean(NaN));

console.log('---');

// Блок 2: Реальный сценарий — проверка заполнения формы
const userName = 'Алия';
const userAge = 25;
const userCity = '';

const hasName = Boolean(userName);
const hasAge = Boolean(userAge);
const hasCity = Boolean(userCity);

console.log('hasName:', hasName);
console.log('hasAge:', hasAge);
console.log('hasCity:', hasCity);

const isFormValid = hasName && hasAge && hasCity;
console.log('isFormValid:', isFormValid);

console.log('---');

// Блок 3: Пасхалка — Boolean от пробельной строки
const spaces = '   ';
console.log('Boolean("   "):', Boolean(spaces));
