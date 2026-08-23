// Блок 1: Тернарник возвращает значение
const price = 1500;
const discount = price > 1000 ? 200 : 0;
console.log('Цена:', price, 'Скидка:', discount);

const finalPrice = price - discount;
console.log('Итог:', finalPrice);

console.log('---');

// Блок 2: Тернарник внутри шаблонной строки
const balance = 5000;
const message = `Баланс: ${balance}, статус: ${balance > 0 ? 'активен' : 'пуст'}`;
console.log(message);

console.log('---');

// Блок 3: Тернарник внутри тернарника (вложенный в значение)
const items = 5;
const shipping = items > 10 ? 0 : items > 5 ? 500 : 1000;
console.log('Доставка для', items, 'товаров:', shipping, 'тг');

const items2 = 3;
const shipping2 = items2 > 10 ? 0 : items2 > 5 ? 500 : 1000;
console.log('Доставка для', items2, 'товаров:', shipping2, 'тг');

const items3 = 15;
const shipping3 = items3 > 10 ? 0 : items3 > 5 ? 500 : 1000;
console.log('Доставка для', items3, 'товаров:', shipping3, 'тг');

console.log('---');

// Блок 4: Тернарник в вычислениях
const quantity = 3;
const unitPrice = 1500;
const total = unitPrice * quantity;
const bonus = total > 5000 ? total * 0.1 : 0;
console.log('Сумма:', total, 'Бонус:', bonus);
