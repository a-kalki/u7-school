let i = 0;
while (i < 3) {
  console.log(i);
  i += 1;
}

console.log('---');

let sum = 0;
let n = 0;
while (n <= 10) {
  sum += n;
  n += 2;
}
console.log(sum);

console.log('---');

let k = 0;
do {
  console.log(k);
  k += 1;
} while (k < 0);

console.log('---');

let attempts = 0;
let num;

do {
  num = Math.floor(Math.random() * 10);
  attempts++;
} while (num <= 5);

console.log(attempts); // укажите диапазон числе attempts
