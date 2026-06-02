console.log('=== Блок 1: Числа в условиях ===');

if (1) {
  console.log('if(1) — truthy, выполняется');
}
if (0) {
  console.log('if(0) — это НЕ выполнится');
} else {
  console.log('if(0) — falsy, сработал else');
}
if (-1) {
  console.log('if(-1) — truthy (любое ненулевое число — true)');
}
// ? Какие числа falsy? Только 0. Все остальные — truthy.

console.log('');

// ============================================================

console.log('=== Блок 2: Строки и другие типы в условиях ===');

let name = '';
if (name) {
  console.log('Имя указано');
} else {
  console.log('Имя не указано — пустая строка falsy');
}

let arr = [];
if (arr) {
  console.log('if([]) — truthy! Пустой массив — true');
}
// ? А пустой объект? if({}) — тоже truthy

let undef;
if (undef) {
  console.log('if(undefined) — не выполнится');
} else {
  console.log('undefined — falsy');
}

console.log('');

// ============================================================

console.log('=== Блок 3: Ловушка с = вместо === ===');

let score = 0;

// Опечатка — присваивание вместо сравнения
if (score = 10) {
  console.log('Отлично!');
}
// ? Что теперь в score? 10!
// ? if(score = 10) не сравнивает, а присваивает и возвращает 10 (truthy)
// ? Ошибка: мы изменили значение, и условие всегда true!
// ? Сравни: if(score = 0) — присвоит 0 (falsy) — блок не выполнится, но score изменился!
// ? Вывод: всегда используй === в условиях, не =.
