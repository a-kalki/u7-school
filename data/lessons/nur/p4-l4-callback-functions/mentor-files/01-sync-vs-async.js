// синхронный колбек

// колбек принимает два параметра (значение, индекс)
function processArray(arr, cb) {
  console.log('  processArray: start');
  for (let i = 0; i < arr.length; i++) {
    cb(arr[i], i);
  }
  console.log('  processArray: finish');
}

console.log('до processArray');
processArray(['order 1', 'order 2', 'order 3'], (item, _i) => {
  console.log('    process:', item);
});
console.log('after processArray');

console.log('');

// ============================================================

// асинхронный колбэк — ответ приходит позже

function fetchOrder(orderId, cb) {
  console.log('  fetchOrder: ', orderId);
  setTimeout(() => {
    const order = { id: orderId, status: 'shipped' };
    console.log('  fetchOrder: shipped for', orderId);
    cb(order);
  }, 1000);
}

console.log('before fetchOrder');
fetchOrder(101, (order) => {
  console.log('    result', order);
});
console.log('after fetchOrder');

console.log('');

// ============================================================

// два асинхронных вызова — перемешивание

function fetchUser(userId, cb) {
  setTimeout(() => {
    console.log('  fetchUser: response for', userId);
    cb({ id: userId, name: 'User ' + userId });
  }, Math.random() * 1000);
}

// запрашиваем двух пользователей одновременно
fetchUser(1, (user) => {
  console.log('    fetched:', user);
});
fetchUser(2, (user) => {
  console.log('    fetched:', user);
});
console.log('оба запроса ушли, ждём ответы...');
