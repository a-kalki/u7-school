const user = { name: 'John', age: 30 };
console.log(user.name);
console.log(user.age);

console.log('---');

user['likes birds'] = true;
console.log(user['likes birds']);

console.log('---');

const key = 'role';
user[key] = 'admin';
console.log(user);

console.log('---');

const obj = { test: undefined };
console.log(obj.test === undefined);
console.log('test' in obj);

console.log('---');

const salaries = { Иванов: 500000, Петрова: 450000 };
console.log(Object.keys(salaries));
console.log(Object.values(salaries));
console.log(Object.entries(salaries));

console.log('---');

const merged = { ...salaries, Козлова: 520000 };
console.log(merged);

console.log('---');

const car = { brand: 'Toyota' };
car.brand = 'Honda';
console.log(car.brand);
console.log(Object.keys(car).length);
