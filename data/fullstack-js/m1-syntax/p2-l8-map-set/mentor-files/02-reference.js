// Map — ссылочный тип
const m1 = new Map([['a', 1]]);
const m2 = m1;
m2.set('b', 2);
console.log(m1.size);
console.log(m1 === m2);

// Set — ссылочный тип
const s1 = new Set([10, 20]);
const s2 = s1;
s2.add(30);
console.log(s1.has(30));

// Два одинаковых Map — разные ссылки
const x = new Map([['key', 'val']]);
const y = new Map([['key', 'val']]);
console.log(x === y);

// Копия Map через конструктор — новый объект
const original = new Map([['x', 1]]);
const copy = new Map(original);
copy.set('y', 2);
console.log(original.size);
console.log(copy.size);

// Копия Set через конструктор
const setOrig = new Set([1, 2]);
const setCopy = new Set(setOrig);
setCopy.add(3);
console.log(setOrig.size);
console.log(setCopy.size);
