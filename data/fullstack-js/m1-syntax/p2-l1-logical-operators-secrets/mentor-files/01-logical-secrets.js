console.log(1 || 0);
console.log(0 || 5);
console.log('0' || '5');
console.log('' || null);

function dangerous() {
  throw new Error('Не должен быть вызван!');
}

console.log(1 || dangerous());
console.log('' || dangerous());

console.log(1 && 0);
console.log(0 && 5);
console.log(3 && 7);
console.log('' && 'hello');

console.log(0 && dangerous());
console.log('hi' && dangerous());

console.log(1 || (0 && 5)); // Приоритет && выше, чем ||
console.log(0 || (1 && 2));
console.log((1 && 2) || (3 && 4));
console.log((0 && 1) || (2 && 3));
console.log(0 || 0 || 5);
console.log(1 && 2 && 3);
console.log(1 && 0 && 3);

// Можно ли гарантировать что name, будет всегда заполнен?
// Если да, то какой синтаксис правильнее с учетом что
//   - может вернуться null
//   - может вернуться пустая строка ''
let _name = prompt('Введите имя') || 'Неизвестный пользователь';
_name = prompt('Введите имя') ?? 'Неизвестный пользователь';
