// Spread (...) разворачивает элементы, Rest (...) собирает остаток

// Копия массива — новый, независимый
const orig = [1, 2, 3];
const copy = [...orig];
copy.push(4);
console.log(orig);
console.log(copy);

console.log('---');

// Объединение и добавление
const a = [1, 2];
const b = [3, 4];
console.log([...a, ...b]);
console.log([0, ...a, 99]);

console.log('---');

// Rest — собирает оставшиеся в переменную
const [fItem, _second, ...rest] = [10, 20, 30, 40];
console.log(fItem);
console.log(rest);

console.log('---');

// Пропуск элементов
const [x, , z] = [1, 2, 3];
console.log(x, z);

console.log('---');

// Spread других типов
console.log([...'hi']);
console.log([...new Set([1, 2, 2, 3])]);

console.log('---');

// Spread для передачи аргументов
const ns = [5, 10, 15];
console.log(Math.max(...ns));
