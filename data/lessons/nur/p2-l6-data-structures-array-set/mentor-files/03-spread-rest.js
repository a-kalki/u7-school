// Spread (...) разворачивает элементы, Rest (...) собирает остаток

// Копия массива — новый, независимый
const orig = [1, 2, 3];
const copy = [...orig];
copy.push(4);
console.log(orig);
console.log(copy);

// Объединение и добавление
const a = [1, 2];
const b = [3, 4];
console.log([...a, ...b]);
console.log([0, ...a, 99]);

// Rest — собирает оставшиеся в переменную
const [first, second, ...rest] = [10, 20, 30, 40];
console.log(first);
console.log(rest);

// Пропуск элементов
const [x, , z] = [1, 2, 3];
console.log(x, z);

// Spread других типов
console.log([...'hi']);
console.log([...new Set([1, 2, 2, 3])]);

// Spread для передачи аргументов
const ns = [5, 10, 15];
console.log(Math.max(...ns));
