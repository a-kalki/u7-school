// Массив — упорядоченная коллекция элементов
const fruits = ['Яблоко', 'Апельсин', 'Слива'];
console.log(fruits[0]); // Доступ по индексу
console.log(fruits.at(-1)); // at() — поддерживает отрицательные индексы
console.log(fruits.length); // length — количество элементов

// Очередь (FIFO): push() добавляет в конец, shift() забирает из начала
const queue = [];
queue.push('первый');
queue.push('второй');
queue.push('третий');
console.log(queue.shift()); // 'первый' — первый вошёл, первый вышел
console.log(queue.shift()); // 'второй' — второй вошёл, первый вышел
console.log(queue); // 'что осталось?'

// Стек (LIFO): push() добавляет в конец, pop() забирает с конца
const stack = [];
stack.push('a');
stack.push('b');
stack.push('c');
console.log(stack.pop()); // 'c' — последний вошёл, первый вышел
console.log(stack.pop());
console.log(stack);

// slice() — возвращает новый массив-копию части, не меняет оригинал
const arr = [1, 2, 3, 4, 5];
console.log(arr.slice(1, 2)); // [2, 3] — с индекса 1 до 3 (не включая)
console.log(arr);

// splice() — удаляет/добавляет элементы, меняет оригинал, возвращает удалённые
console.log(arr.splice(2, 1)); // [3] — удалили 1 элемент с индекса 2
console.log(arr); // [1, 2, 4, 5] — оригинал изменился
