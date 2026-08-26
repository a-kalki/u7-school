// Массивы — ссылочный тип: переменная хранит ссылку, а не сами данные
const a = [1, 2, 3];
const b = a; // b ссылается на тот же массив
b.push(4);
console.log(a);
console.log(b);

console.log('---');

// Сравнение по ссылке: два одинаковых массива — не равны
const x = [1, 2, 3];
const y = [1, 2, 3];
console.log(x === y);
console.log(x === x);

console.log('---');

// Копия через spread — новый массив, не связанный с оригиналом
const original = [10, 20];
const copy = [...original];
copy.push(30);
console.log(original);
console.log(copy);

console.log('---');

// Array — тоже ссылочный тип
const arrA = [1, 2];
const arrB = arrA;
arrB.push(3);
console.log(arrA.length);
console.log(arrA === arrB);
