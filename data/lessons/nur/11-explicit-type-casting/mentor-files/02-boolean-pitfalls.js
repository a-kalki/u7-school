console.log('=== Блок 1: new Boolean() — объект-ловушка ===');

let flag1 = false;
let flag2 = new Boolean(false);

console.log('typeof flag1 =', typeof flag1);
// ? boolean — примитив

console.log('typeof flag2 =', typeof flag2);
// ? object! new Boolean() создаёт объект-обёртку

console.log('flag1 == false =', flag1 == false);
// ? true, примитив сравнивается с примитивом

console.log('flag2 == false =', flag2 == false);
// ? true — объект приводится к примитиву через ==

console.log('flag2 === false =', flag2 === false);
// ? false! Объект и примитив — разные типы

if (flag2) {
  console.log('if(flag2) — выполнится, ведь объект всегда truthy!');
}
// ? Вот ловушка: new Boolean(false) — объект, а объекты truthy
// ? Поэтому if (new Boolean(false)) выполняется, хотя логически это false!

console.log('');

// ============================================================

console.log('=== Блок 2: String() и new String() ===');

let s1 = 'hello';
let s2 = new String('hello');

console.log('typeof s1 =', typeof s1);
console.log('typeof s2 =', typeof s2);
// ? Та же история: s2 — объект, а не строка

console.log('s1 === "hello" =', s1 === 'hello');
console.log('s2 === "hello" =', s2 === 'hello');
// ? true vs false — объектная обёртка не равна примитиву

console.log('');

// ============================================================

console.log('=== Блок 3: Boolean() со сложными типами ===');

console.log('Boolean([]) =', Boolean([]));
// ? Пустой массив — truthy. Неожиданно для новичков

console.log('Boolean([0]) =', Boolean([0]));
// ? [0] — это массив с одним элементом 0.
// ? Массив — объект, объект — truthy. Несмотря на то, что внутри 0!

console.log('Boolean({}) =', Boolean({}));
// ? Пустой объект — truthy

// А что с Number и String?
console.log('Boolean(Number("abc")) =', Boolean(Number('abc')));
// ? Number('abc') = NaN, а NaN — falsy

console.log('Boolean(String("")) =', Boolean(String('')));
// ? String('') — это примитив '' (пустая строка), falsy
