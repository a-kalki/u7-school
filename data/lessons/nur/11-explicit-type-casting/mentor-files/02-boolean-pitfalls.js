console.log('=== Блок 1: Boolean() для проверки наличия значения ===');

// Реальный пример: проверка заполнил ли пользователь форму
let name = 'Алия';
let age = 0;  // 0 лет — младенец, но это валидное значение

console.log('Boolean(name) =', Boolean(name));
// ? Непустая строка → true

console.log('Boolean(age) =', Boolean(age));
// ? 0 → false! Хотя возраст = 0 — это осмысленное значение
// Проблема: if (age) {...} не сработает при age = 0
// Правильно: if (age !== null && age !== undefined)

console.log('');

// ============================================================

console.log('=== Блок 2: Проверка наличия товаров в корзине ===');

let cart = ['яблоко', 'банан', 'груша'];
console.log('Boolean(cart) =', Boolean(cart));
// ? Массив — объект → true. Даже пустой массив — true!

let emptyCart = [];
console.log('Boolean(emptyCart) =', Boolean(emptyCart));
// ? Тоже true! Но корзина-то пуста!

// Правильная проверка:
console.log('cart.length > 0 =', cart.length > 0);
console.log('emptyCart.length > 0 =', emptyCart.length > 0);
// ? Вот так правильно. Нельзя полагаться на Boolean() для массивов

console.log('');

// ============================================================

console.log('=== Блок 3: !! для быстрого приведения к boolean ===');

// !! (двойное отрицание) — короткий способ получить boolean
// Используется в реальном коде, но с осторожностью

function canCheckout(cart) {
  // Проверка: есть ли товары и известен ли адрес
  let hasItems = cart.length > 0;
  let hasAddress = true;  // представим, что адрес есть

  // !! даёт гарантированный boolean, даже если пришло что-то другое
  return !!(hasItems && hasAddress);
}

console.log('Можно оформить заказ:', canCheckout(['яблоко']));

// !! полезен когда нужно сохранить именно true/false, а не truthy/falsy
let userName = 'Дамир';
let hasName = !!userName;
console.log('hasName:', hasName, '(тип:', typeof hasName + ')');
