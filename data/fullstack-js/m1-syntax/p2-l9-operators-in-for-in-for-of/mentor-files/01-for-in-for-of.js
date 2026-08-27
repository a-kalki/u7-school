const obj = { test: undefined };
console.log(obj.test === undefined);
console.log('test' in obj);

console.log('---');

const salaries = { Иванов: 500000, Петрова: 450000 };
for (const key in salaries) {
  console.log(key);
}

console.log('---');

const arr = [10, 20, 30];
for (const idx in arr) {
  console.log(idx);
}

console.log('---');

for (const val of arr) {
  console.log(val);
}

console.log('---');

for (const char of 'Hello') {
  console.log(char);
}
