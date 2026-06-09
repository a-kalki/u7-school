// Массивы — ссылочный тип: переменная хранит ссылку, а не сами данные
const a = [1, 2, 3];
const b = a;         // b ссылается на тот же массив
b.push(4);
console.log(a);
console.log(b);

// Сравнение по ссылке: два одинаковых массива — не равны
const x = [1, 2, 3];
const y = [1, 2, 3];
console.log(x === y);
console.log(x === x);

// Копия через spread — новый массив, не связанный с оригиналом
const original = [10, 20];
const copy = [...original];
copy.push(30);
console.log(original);
console.log(copy);

// Set — тоже ссылочный тип
const setA = new Set([1, 2]);
const setB = setA;
setB.add(3);
console.log(setA.size);
console.log(setA === setB);
