console.log('=== Блок 1: Двойное отрицание !! ===');

console.log('!!true =', !!true);
console.log('!!0 =', !!0);
// ? ! превращает в boolean и инвертирует. !! — двойная инверсия, возвращает исходное boolean-значение

console.log('!!1 =', !!1);
console.log('!!"" =', !!'');
console.log('!!"hello" =', !!'hello');
console.log('!!null =', !!null);
console.log('!!undefined =', !!undefined);
// ? !! — короткий способ привести любое значение к boolean
// ? Какие значения дают false? (falsy: 0, '', null, undefined, false, NaN)
// ? Какие — true? (все остальные: 1, 'hello', [], {})

console.log('');

// ============================================================

console.log('=== Блок 2: Отрицание с разными типами ===');

console.log('!0 =', !0);
// ? 0 — falsy, поэтому !0 = true

console.log('!" =', !'');
// ? Пустая строка — falsy

console.log('!"hello" =', !'hello');
// ? Непустая строка — truthy, инверсия — false

console.log('![] =', ![]);
// ? Пустой массив — truthy! Это часто путает новичков

console.log('!{} =', !{});
// ? Пустой объект — тоже truthy

console.log('');

// ============================================================

console.log('=== Блок 3: Отрицание в условиях (ловушка) ===');

let age = 0;
console.log('!age =', !age);
// ? age = 0, !0 = true. Но age не undefined — он просто 0!

let name = '';
if (!name) {
  console.log('Имя не указано');
}
// ? Так проверяют пустую строку. Но что если имя может быть "0"?
// ? "0" — truthy (!"0" = false), но !0 = true. Будь внимателен!
