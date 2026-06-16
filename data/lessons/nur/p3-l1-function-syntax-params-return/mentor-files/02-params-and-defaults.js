// 02-params-and-defaults.js
// Параметры по умолчанию и практические примеры

// Функция с параметром по умолчанию
function greet(name, greeting = 'Здравствуйте') {
  return `${greeting}, ${name}!`;
}

console.log(greet('Айгуль'));
console.log(greet('Бауыржан', 'Сәлем'));
console.log(greet('Диана', 'Hello'));

// Расчёт налога — ставка НДС 12% по умолчанию
function getTax(amount, taxRate = 12) {
  return Math.round((amount * taxRate) / 100);
}

console.log(getTax(10000));
console.log(getTax(10000, 5));
console.log(getTax(15500));

// Подсчёт символов в строке — по умолчанию ищем пробелы
function countChar(text, char = ' ') {
  let count = 0;
  for (let i = 0; i < text.length; i += 1) {
    if (text[i] === char) {
      count += 1;
    }
  }
  return count;
}

const msg = 'Астана — столица Казахстана';
console.log(countChar(msg));
console.log(countChar(msg, 'а'));
console.log(countChar(msg, '-'));
