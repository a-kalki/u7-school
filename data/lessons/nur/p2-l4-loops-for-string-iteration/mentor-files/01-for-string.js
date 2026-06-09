const word = 'cat';
for (let i = 0; i < word.length; i += 1) {
  console.log(word[i]);
}

const text = 'hello world';
let countO = 0;
for (let i = 0; i < text.length; i++) {
  if (text[i] === 'o') countO++;
}
console.log(countO);

const str = 'javascript';
let found = -1;
for (let i = 0; i < str.length; i++) {
  if (str[i] === 's') {
    found = i;
    break;
  }
}
console.log(found);

const rev = [];
for (let i = str.length - 1; i >= 0; i -= 1) {
  rev.push(str[i]);
}
console.log(rev);
