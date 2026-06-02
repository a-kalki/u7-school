console.log('=== Блок 1: typeof для разных значений ===');
console.log('typeof 42:', typeof 42);
console.log('typeof "hello":', typeof 'hello');
console.log('typeof true:', typeof true);
console.log('typeof undefined:', typeof undefined);
console.log('typeof null:', typeof null);           // какой сюрприз?
console.log('typeof {name: "Алиса"}:', typeof { name: 'Алиса' });
console.log('typeof [1, 2, 3]:', typeof [1, 2, 3]); // массив — это?
console.log('typeof NaN:', typeof NaN);             // NaN — это число?!
console.log('typeof function(){}:', typeof function() { });
console.log('');

// ============================================================
console.log('=== Блок 2: typeof возвращает строку ===');

console.log('typeof typeof 5', typeof typeof 5); // ?
console.log('');
