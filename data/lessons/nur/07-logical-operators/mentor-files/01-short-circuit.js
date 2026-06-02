console.log('=== Блок 1: && возвращает не только true/false ===');

let r1 = 0 && 'hello';
console.log('0 && "hello" =', r1);
// ? && возвращает первое falsy-значение, иначе последнее

let r2 = 1 && 'hello';
console.log('1 && "hello" =', r2);
// ? Оба truthy → вернёт последнее (hello)

let r3 = 'cat' && 'dog';
console.log('"cat" && "dog" =', r3);
// ? Оба truthy → последнее (dog)

let r4 = null && 'hello';
console.log('null && "hello" =', r4);
// ? null — falsy → вернёт null, до hello не дойдёт

console.log('');

// ============================================================

console.log('=== Блок 2: || возвращает не только true/false ===');

let s1 = 1 || 'hello';
console.log('1 || "hello" =', s1);
// ? || возвращает первое truthy-значение, иначе последнее

let s2 = 0 || 'hello';
console.log('0 || "hello" =', s2);
// ? 0 — falsy, поэтому идёт дальше → hello

let s3 = '' || 'default';
console.log('"" || "default" =', s3);
// ? Пустая строка — falsy → 'default'. Так ставят значения по умолчанию!

let s4 = undefined || null || 0 || 'ok';
console.log('undefined || null || 0 || "ok" =', s4);
// ? Идёт по цепочке, пока не найдёт truthy

console.log('');

// ============================================================

console.log('=== Блок 3: Short-circuit (сокращённое вычисление) ===');

function say(msg) {
  console.log('  → say вызван с:', msg);
  return true;
}

let sc1 = false && say('никогда');
console.log('false && say(...) — выполнился ли say?');
// ? && вычисляется слева направо. Если левый операнд false — правый не проверяется!
// ? say('никогда') НЕ выполнится

let sc2 = true || say('тоже нет');
console.log('true || say(...) — выполнился ли say?');
// ? || — если левый true, правый не нужен. say('тоже нет') НЕ выполнится

let sc3 = false || say('а вот это да');
console.log('false || say(...) — выполнился ли say?');
// ? А здесь левый false → нужно проверить правый. say() выполнится!
