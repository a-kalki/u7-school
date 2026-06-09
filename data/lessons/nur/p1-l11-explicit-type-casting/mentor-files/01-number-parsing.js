console.log('=== Блок 1: Number() vs parseInt() — разное поведение ===');

// Реальный пример: парсинг цены из строки
let priceStr = '1500 тг';

console.log('Number("1500 тг") =', Number('1500 тг'));

console.log('parseInt("1500 тг") =', parseInt('1500 тг'));

let width = '100px';
console.log('Number("100px") =', Number('100px'));
console.log('parseInt("100px") =', parseInt('100px'));

console.log('');

// ============================================================

console.log('=== Блок 2: parseInt и разные системы счисления ===');

// По умолчанию parseInt('010') может повести себя неожиданно в старых браузерах
console.log('parseInt("010") =', parseInt('010'));

let year = '2024';
console.log('parseInt("2024", 10) =', parseInt(year, 10));

console.log('');

// ============================================================

console.log('=== Блок 3: Проверка результата Number() ===');

function calculateTotal(priceStr, qtyStr) {
  let price = Number(priceStr);
  let qty = Number(qtyStr);

  // Проверка: если хоть одно NaN — возвращаем ошибку
  if (Number.isNaN(price) || Number.isNaN(qty)) {
    return 'Ошибка: неверный ввод';
  }

  return price * qty;
}

console.log('1500 тг × 3 шт:', calculateTotal('1500', '3'));
console.log('не число × 5 шт:', calculateTotal('abc', '5'));
console.log('пустая строка × 2:', calculateTotal('', '2'));
