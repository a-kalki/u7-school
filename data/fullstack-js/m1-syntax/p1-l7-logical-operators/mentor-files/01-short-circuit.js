console.log('=== Блок 1: && возвращает не только true/false ===');

const r1 = 0 && 'hello';
console.log('0 && "hello" =', r1);

const r2 = 1 && 'hello';
console.log('1 && "hello" =', r2);

const r3 = 'cat' && 'dog';
console.log('"cat" && "dog" =', r3);

const r4 = null && 'hello';
console.log('null && "hello" =', r4);

console.log('');

// ============================================================

console.log('=== Блок 2: || возвращает не только true/false ===');

const s1 = 1 || 'hello';
console.log('1 || "hello" =', s1);

const s2 = 0 || 'hello';
console.log('0 || "hello" =', s2);

const s3 = '' || 'default';
console.log('"" || "default" =', s3);

const s4 = undefined || null || 0 || 'ok';
console.log('undefined || null || 0 || "ok" =', s4);

console.log('');

// ============================================================

console.log('=== Блок 3: Short-circuit (сокращённое вычисление) ===');

function say(msg) {
  console.log('  → say вызван с:', msg);
  return true;
}

const sc1 = false && say('никогда');
console.log(sc1);

const sc2 = true || say('тоже нет');
console.log(sc2);

const sc3 = false || say('а вот это да');
console.log(sc3);
