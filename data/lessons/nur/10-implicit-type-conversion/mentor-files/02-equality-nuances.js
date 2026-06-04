console.log('=== Блок 1: == с объектами и примитивами ===');

console.log('[] == false =', [] == false);
// ? Пустой массив приводится к '' (пустая строка), потом к 0, false→0. true!

console.log('[] == 0 =', [] == 0);
// ? [] → '' → 0. 0 == 0 → true

console.log('[] == "" =', [] == '');
// ? [] → '' (toString). '' == '' → true

console.log('[1] == 1 =', [1] == 1);
// ? [1] → '1' (toString) → 1 (Number). 1 == 1 → true

console.log('"1" == true =', '1' == true);
// ? true → 1, '1' → 1. 1 == 1 → true

console.log('');

// ============================================================

console.log('=== Блок 2: null, undefined и == ===');

console.log('null == undefined =', null == undefined);
// ? Спецификация: только null и undefined равны друг другу через ==

console.log('null == 0 =', null == 0);
// ? Вопреки ожиданиям: null НЕ преобразуется в 0 для ==
// ? null преобразуется в 0 только для >, <, >=, <=

console.log('null >= 0 =', null >= 0);
// ? А здесь null → 0. 0 >= 0 → true
// ? Парадокс: null >= 0 true, null <= 0 true, но null == 0 false!

console.log('undefined == 0 =', undefined == 0);
// ? undefined при == преобразуется только к null, больше ни к чему

console.log('');

// ============================================================

console.log('=== Блок 3: Практический вывод ===');

// Эти примеры показывают, почему == непредсказуем
// Лучше всегда использовать ===

let input = '0';  // пользователь ввёл 0 как строку
if (input == false) {
  console.log('==: ввели false?');  // это выполнится! '0' → 0, 0 == false → true
}

if (input === false) {
  console.log('===: ввели false?');  // не выполнится — типы разные
}

console.log('');
console.log('Вывод: == таит сюрпризы. === всегда предсказуем.');
