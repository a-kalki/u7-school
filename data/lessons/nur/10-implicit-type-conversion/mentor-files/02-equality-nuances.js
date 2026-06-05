console.log('=== Блок 1: == с числами и строками — ловушка ===');

let userAge = '18';  // пришло из prompt()

if (userAge == 18) {
  console.log('Возраст 18 — через == true');
}
// ? == приводит строку к числу, поэтому true. Кажется удобным, но...

if (userAge === 18) {
  console.log('Возраст 18 — через === true');
} else {
  console.log('Возраст 18 — через === false');
}
// ? === не приводит типы — строка !== число. Результат false.

// А если пользователь ввёл не число?
let input = 'abc';
if (input == 0) {
  console.log('"abc" == 0 — true?');
}
// ? 'abc' → NaN, NaN == 0 → false. Но unexpected!

console.log('');

// ============================================================

console.log('=== Блок 2: == с null и undefined — скрытый баг ===');

let user = null;  // пользователь не найден в базе

if (user == undefined) {
  console.log('Пользователь не найден (==)');
}
// ? null == undefined → true. Но это скрывает разницу между null и undefined

if (user === undefined) {
  console.log('Пользователь не найден (===)');
} else {
  console.log('Пользователь null, не undefined');
}
// ? === различает null и undefined. Лучше проверять: user === null

console.log('');

// ============================================================

console.log('=== Блок 3: Практика — проверка наличия значения ===');

function getDiscount(price) {
  // Если price не указано (undefined) — вернуть 0
  // Если price = 0 — это допустимое значение (бесплатно)
  if (price == false) {
    return 0;  // баг: price = 0 вернёт 0, но price = undefined тоже вернёт 0
  }
  return price * 0.1;
}

console.log('getDiscount(undefined) =', getDiscount(undefined));
console.log('getDiscount(0) =', getDiscount(0));
console.log('getDiscount(1000) =', getDiscount(1000));
// ? Из-за == не видно разницы между undefined и 0. Правильно: price === undefined
