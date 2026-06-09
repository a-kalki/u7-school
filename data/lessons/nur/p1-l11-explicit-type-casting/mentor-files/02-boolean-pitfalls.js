console.log('=== Блок 1: Boolean() для проверки наличия значения ===');

// Реальный пример: проверка заполнил ли пользователь форму
const name = 'Алия';
const age = 0; // 0 лет — младенец, но это валидное значение

console.log('Boolean(name) =', Boolean(name));

console.log('Boolean(age) =', Boolean(age));

console.log('');

// ============================================================

console.log('=== Блок 2: Проверка наличия товаров в корзине ===');

const cart = ['яблоко', 'банан', 'груша'];
console.log('Boolean(cart) =', Boolean(cart));

const emptyCart = [];
console.log('Boolean(emptyCart) =', Boolean(emptyCart));

// Правильная проверка:
console.log('cart.length > 0 =', cart.length > 0);
console.log('emptyCart.length > 0 =', emptyCart.length > 0);

console.log('');

// ============================================================

console.log('=== Блок 3: !! для быстрого приведения к boolean ===');

// !! (двойное отрицание) — короткий способ получить boolean
// Используется в реальном коде, но с осторожностью

function canCheckout(cart) {
  // Проверка: есть ли товары и известен ли адрес
  const hasItems = cart.length > 0;
  const hasAddress = true; // представим, что адрес есть

  // !! даёт гарантированный boolean, даже если пришло что-то другое
  return !!(hasItems && hasAddress);
}

console.log('Можно оформить заказ:', canCheckout(['яблоко']));

// !! полезен когда нужно сохранить именно true/false, а не truthy/falsy
const userName = 'Дамир';
const hasName = !!userName;
console.log('hasName:', hasName, '(тип:', `${typeof hasName})`);
