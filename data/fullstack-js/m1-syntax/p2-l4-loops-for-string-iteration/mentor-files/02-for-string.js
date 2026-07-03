let vowels = 0;
for (let i = 0; i < text.length; i++) {
  if ('aeiou'.includes(text[i])) vowels++;
}
console.log(vowels);

let repeat = '';
for (let i = 0; i < 3; i += 1) {
  repeat += 'ab';
}
console.log(repeat);

let even = '';
for (let i = 0; i < str.length; i += 2) {
  even += str[i];
}
console.log(even);

let digits = 0;
for (let i = 0; i < text.length; i++) {
  if (text[i] >= '0' && text[i] <= '9') digits++;
}
console.log(digits);
