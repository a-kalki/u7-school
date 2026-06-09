// Spread (...) для объектов — копия и слияние полей
// Rest (...) — извлечение части полей в отдельную переменную

// Копия объекта — новый, независимый
const user = { name: 'Иван', age: 25 };
const copy = { ...user };
copy.age = 30;
console.log(user.age);
console.log(copy.age);

// Слияние — позднее поле перезаписывает более раннее
const base = { role: 'user', active: true };
const ext = { ...base, role: 'admin', lastLogin: '2026-06-09' };
console.log(ext);

// Перезапись и добавление
const emp = { name: 'Петр', salary: 500000 };
const updated = { ...emp, salary: 550000, bonus: 50000 };
console.log(updated);

// Rest — собирает оставшиеся поля
const { name, ...rest } = {
  name: 'Алия',
  age: 28,
  city: 'Алматы',
  role: 'mentor',
};
console.log(name);
console.log(rest);

// Извлечение нескольких полей + rest
const data = { x: 10, y: 20, z: 30, label: 'point' };
const { label, ...coords } = data;
console.log(label);
console.log(coords);
