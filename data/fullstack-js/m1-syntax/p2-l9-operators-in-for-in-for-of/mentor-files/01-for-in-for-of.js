const obj = { test: undefined };
console.log(obj.test === undefined);
console.log('test' in obj);
const salaries = { Иванов: 500000, Петрова: 450000 };
for (const key in salaries) {
  console.log(key);
}

const arr = [10, 20, 30];
for (const idx in arr) {
  console.log(idx);
}

for (const val of arr) {
  console.log(val);
}

for (const char of 'Hello') {
  console.log(char);
}
