const user = { name: 'John', age: 30 };
console.log(user.name);
console.log(user.age);

user['likes birds'] = true;
console.log(user['likes birds']);

const key = 'role';
user[key] = 'admin';
console.log(user.role);

const obj = { test: undefined };
console.log(obj.test === undefined);
console.log('test' in obj);

const salaries = { Иванов: 500000, Петрова: 450000 };
console.log(Object.keys(salaries));
console.log(Object.values(salaries));
console.log(Object.entries(salaries));

const merged = { ...salaries, Козлова: 520000 };
console.log(merged);

const car = { brand: 'Toyota' };
car.brand = 'Honda';
console.log(car.brand);
console.log(Object.keys(car).length);
