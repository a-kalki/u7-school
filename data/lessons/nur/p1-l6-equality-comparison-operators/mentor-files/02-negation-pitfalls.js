console.log('=== Блок 1: Двойное отрицание !! ===');

console.log('!!true =', !!true);
console.log('!!0 =', !!0);

console.log('!!1 =', !!1);
console.log('!!"" =', !!'');
console.log('!!"hello" =', !!'hello');
console.log('!!null =', !!null);
console.log('!!undefined =', !!undefined);

console.log('');

// ============================================================

console.log('=== Блок 2: Отрицание с разными типами ===');

console.log('!0 =', !0);

console.log('!" =', !'');

console.log('!"hello" =', !'hello');

console.log('![] =', ![]);

console.log('!{} =', !{});

console.log('');

// ============================================================

console.log('=== Блок 3: Отрицание в условиях (ловушка) ===');

let age = 0;
console.log('!age =', !age);

let name = '';
if (!name) {
  console.log('Имя не указано');
}
