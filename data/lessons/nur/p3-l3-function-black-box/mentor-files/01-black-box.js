// 01-black-box.js
// Чёрный ящик — используем функцию, не зная реализации

// Две реализации formatDate с одинаковым контрактом
function formatDate(day, month, year) {
  let d = day;
  let m = month;
  if (day < 10) {
    d = '0' + day;
  }
  if (month < 10) {
    m = '0' + month;
  }
  return d + '.' + m + '.' + year;
}

// Другая реализация — через тернарный оператор
function formatDateV2(day, month, year) {
  const d = day < 10 ? '0' + day : '' + day;
  const m = month < 10 ? '0' + month : '' + month;
  return d + '.' + m + '.' + year;
}

// Снаружи поведение одинаковое — клиенту не важно КАК
console.log(formatDate(5, 6, 2026));
console.log(formatDateV2(5, 6, 2026));
console.log(formatDate(15, 12, 2025));
console.log(formatDateV2(15, 12, 2025));

// Плохой чёрный ящик: имя не говорит ЧТО, параметры неясны
function fd(d, m, y) {
  return d + '.' + m + '.' + y;
}

console.log(fd(1, 1, 2024)); // Что такое fd? Непонятно.

// Имя должно говорить ЧТО, а не КАК
// Плохо: formatDateWithIf — раскрывает реализацию
// Хорошо: formatDate — говорит что делает
