console.log('=== Блок 1: parseInt vs Number — разное поведение ===');

console.log('parseInt("100px") =', parseInt('100px'));
// ? parseInt читает цифры до первого не-цифрового символа

console.log('Number("100px") =', Number('100px'));
// ? Number требует, чтобы вся строка была числом. Иначе NaN

console.log('parseInt("0x1A") =', parseInt('0x1A'));
// ? parseInt('0x..') определяет как шестнадцатеричное — результат 26

console.log('Number("0x1A") =', Number('0x1A'));
// ? Number тоже понимает 0x — результат 26

console.log('parseInt("0o10") =', parseInt('0o10'));
// ? parseInt НЕ понимает восьмеричный 0o. Результат 0 (только '0')

console.log('parseInt("  10") =', parseInt('  10'));
// ? parseInt игнорирует пробелы

console.log('');

// ============================================================

console.log('=== Блок 2: .toString() — не для всех ===');

let num = 255;
console.log('num.toString() =', num.toString());
// ? У чисел .toString() есть

console.log('num.toString(16) =', num.toString(16));
// ? toString можно вызвать с основанием системы счисления — получим hex

let bool = true;
console.log('bool.toString() =', bool.toString());

// А теперь проблемные случаи:
let un;
// console.log(un.toString());
// ? Раскомментируй. Что будет? TypeError: Cannot read properties of undefined

let nl = null;
// console.log(nl.toString());
// ? И здесь та же ошибка. toString нет у null и undefined

console.log('');

// ============================================================

console.log('=== Блок 3: Унарный + и -  ===');

console.log('+"42" =', +'42');
console.log('+"-3.14" =', +'-3.14');
console.log('+true =', +true);
// ? + превращает в число. true → 1

console.log('+false =', +false);
// ? false → 0

console.log('+"abc" =', +'abc');
// ? Не число → NaN

console.log('-10 + "5" =', -10 + '5');
// ? Не путай с -10 + 5: здесь + определяет конкатенацию, потому что "5" строка
// ? А -10 - "5" = -15
