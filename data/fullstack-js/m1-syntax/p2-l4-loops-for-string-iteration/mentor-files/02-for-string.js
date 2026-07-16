const text = 'javascript';
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

// const text = 'javascript';
let even = '';
for (let i = 0; i < text.length; i += 2) {
  even += text[i];
}
console.log(even);

let range = '';
for (let i = 0; i < text.length; i++) {
  if (text[i] >= 'j' && text[i] <= 's') {
    range += text[i];
  }
}
console.log(range);
