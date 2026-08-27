// Объекты — ссылочный тип: переменная хранит ссылку
const user1 = { name: 'Иван', age: 25 };
const user2 = user1;
user2.age = 30;
console.log(user1.age);
console.log(user1 === user2);

console.log('---');

// Два одинаковых объекта — разные ссылки
const a = { value: 10 };
const b = { value: 10 };
console.log(a === b);

console.log('---');

// Поверхностная копия через spread
const original = { x: 1, y: 2 };
const copy = { ...original };
copy.x = 99;
console.log(original.x);
console.log(copy.x);

console.log('---');

// Вложенные объекты: spread копирует только верхний уровень
const nested = { a: 1, inner: { b: 2 } };
const shallow = { ...nested };
shallow.a = 5;
shallow.inner.b = 999;
console.log(nested.a);
console.log(nested.inner.b);
