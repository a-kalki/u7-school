function outer() {
  const message = 'секрет';
  console.log('  outer: message =', message);

  function inner() {
    console.log('  inner: message =', message);
  }

  inner();
  console.log('  outer завершается');
}

console.log('до outer');
outer();
console.log('после outer');

console.log('');

// ============================================================

function createGreeter(name) {
  const greeting = `Hi ${name}!`;
  console.log('  createGreeter: make function to', name);
  return () => {
    console.log('  ', greeting);
  };
}

const greetAliya = createGreeter('Алия');
const greetBek = createGreeter('Бек');

greetAliya();
greetAliya();
greetBek();

// Каждый greeter помнит свой name — это замыкание

console.log('');

// ============================================================

function makeMultiplier(factor) {
  console.log('  makeMultiplier: factor =', factor);
  return (value) => {
    const result = value * factor;
    console.log('  ', value, '*', factor, '=', result);
    return result;
  };
}

const double = makeMultiplier(2);
const triple = makeMultiplier(3);

console.log('double(5):', double(5));
console.log('triple(5):', triple(5));
console.log('double(10):', double(10));

// умножение отложено до вызова возвращённой функции;
// умножение действие легкое, но так мы можем откладывать
// действительно сложные вычисления
