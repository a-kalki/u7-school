for (let i = 1; i <= 3; i++) {
  const doubled = i * 2;
  console.log(`итерация ${i}: doubled = ${doubled}`);
}
console.log('после цикла: i =', i);
console.log('после цикла: doubled =', doubled);

console.log('');

function makeUser(name) {
  const user = { name: name };
  console.log('  создан:', user);
  return user;
}

// будет ли тут работать GC?
// если да, то в какой момент?
let a = makeUser('Алия');
let b = makeUser('Бек');
b = null;
const c = a;
a = null;
makeUser('Чингиз'); // удален или жив?
console.log('a:', a); // удален или жив?
console.log('b:', b); // удален или жив?
console.log(c); // удален или жив?
