const salaries = { Иванов: 500000, Петрова: 450000 };

for (const [name, salary] of Object.entries(salaries)) {
  console.log(`${name}: ${salary}`);
}

console.log('---');

const set = new Set([1, 2, 3, 2, 1]);
for (const v of set) {
  console.log(v);
}

console.log('---');

const map = new Map([
  ['a', 1],
  ['b', 2],
]);
for (const [k, v] of map) {
  console.log(k, v);
}

console.log('---');

const nums = [5, 10, 15];
for (const val of nums) {
  console.log(val * 2);
}
