let x = 10;
while (x > 0) {
  x -= 3;
}
console.log(x);

console.log('---');

let chars = '';
while (chars.length < 5) {
  chars += 'x';
}
console.log(chars);

console.log('---');

let f = 1;
let m = 1;
while (m <= 6) {
  f *= m;
  m++;
}
console.log(f);

console.log('---');

let cur = 0;
while (cur < 100) {
  cur += 25;
}
console.log(cur);
