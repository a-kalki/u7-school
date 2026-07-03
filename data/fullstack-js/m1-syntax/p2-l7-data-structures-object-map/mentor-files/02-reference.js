// Объекты — ссылочный тип: переменная хранит ссылку
const user1 = { name: 'Иван', age: 25 };
const user2 = user1;
user2.age = 30;
console.log(user1.age);
console.log(user1 === user2);

// Два одинаковых объекта — разные ссылки
const a = { value: 10 };
const b = { value: 10 };
console.log(a === b);

// Поверхностная копия через spread
const original = { x: 1, y: 2 };
const copy = { ...original };
copy.x = 99;
console.log(original.x);
console.log(copy.x);

// Вложенные объекты: spread копирует только верхний уровень
const nested = { a: 1, inner: { b: 2 } };
const shallow = { ...nested };
shallow.inner.b = 999;
console.log(nested.inner.b);
