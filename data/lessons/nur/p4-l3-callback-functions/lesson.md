# Callback-функции (колбэки)

## Определение

Callback (колбэк, функция обратного вызова) — функция, переданная как аргумент в другую функцию, чтобы быть вызванной позже, по завершении определённого действия.

```javascript
function cb() {
  console.log("Здесь выполняется работа колбека!");
}

function doSomething(callback) {
  console.log('Предварительная работа до вызова колбэка');
  callback(); // вызываем переданную функцию
  console.log('Можно что то делать и после вызова колбэка');
}

doSomething(cb);
```

---

## Синхронные колбэки

Синхронный колбек, это когда функция-колбэк вызывается сразу же и не ломает поток выполнения, синхронно:

```javascript
// эта функция позволяет выполнить определенные в cb
// действия для каждого элемента
function processArray(arr, callback) {
  for (let item of arr) {
    callback(item);
  }
}

// распечатать увеличенные на два значения
processArray([1, 2, 3], item => console.log(item * 2));
// 2, 4, 6
```

Колбэк `item => console.log(item * 2)` вызывается немедленно для каждого элемента — это синхронно. Управление не возвращается в основной код, пока цикл не завершится.

---

## Методы массивов с колбэками

В js api уже много встроенных методов, принимающих колбэк. Они синхронные. Вот главные методы массивов:

### forEach — выполнить действие для каждого элемента

```javascript
let names = ['Алия', 'Бек', 'Чингиз'];

names.forEach(function(item, index) {
  console.log(index + ': ' + item);
});
// 0: Алия // 1: Бек // 2: Чингиз
```

`forEach` вызывает колбэк для каждого элемента и ничего не возвращает (`undefined`).

### map — преобразовать каждый элемент в новый массив

```javascript
let numbers = [1, 2, 3, 4, 5];

let doubled = numbers.map(function(item) {
  return item * 2;
});
console.log(doubled); // [2, 4, 6, 8, 10]
```

`map` возвращает **новый** массив той же длины. Исходный массив не меняется.

### filter — отобрать элементы по условию

```javascript
let numbers = [1, 2, 3, 4, 5, 6];

let even = numbers.filter(function(item) {
  return item % 2 === 0;
});
console.log(even); // [2, 4, 6]
```

Колбэк должен вернуть `true` (оставить) или `false` (пропустить). Возвращается новый массив.

### find — найти первый подходящий элемент

```javascript
let users = [
  { name: 'Алия', age: 23 },
  { name: 'Бек', age: 17 },
  { name: 'Чингиз', age: 30 }
];

let adult = users.find(function(user) {
  return user.age >= 18;
});
console.log(adult); // { name: 'Алия', age: 23 }
```

Возвращает **сам элемент** (не массив) или `undefined`, если ничего не найдено.

### reduce — свернуть массив в одно значение

```javascript
let numbers = [1, 2, 3, 4, 5];

let sum = numbers.reduce(function(acc, item) {
  return acc + item;
}, 0);
console.log(sum); // 15
```

Колбэк получает **аккумулятор** (`acc`) и текущий элемент. Результат колбэка становится новым аккумулятором для следующего элемента. Второй аргумент `reduce` — начальное значение аккумулятора.

### Те же методы со стрелочными функциями

```javascript
let numbers = [1, 2, 3, 4, 5, 6];

numbers.forEach((item, i) => console.log(i + ': ' + item));

let doubled = numbers.map(item => item * 2);
let even = numbers.filter(item => item % 2 === 0);
let found = numbers.find(item => item > 4);
let sum = numbers.reduce((acc, item) => acc + item, 0);
```

---

## Цепочки методов на практике

Методы `map`, `filter`, `find`, `reduce` возвращают результат, поэтому их можно объединять в **цепочки** — результат одного метода передаётся следующему.

### filter + map: выбрать и преобразовать

```javascript
let scores = [85, 42, 67, 91, 55];

let highScoresDoubled = scores
  .filter(score => score > 60)   // [85, 67, 91]
  .map(score => score * 2);      // [170, 134, 182]

console.log(highScoresDoubled);  // [170, 134, 182]
```

### map + reduce: преобразовать и посчитать

```javascript
let prices = [100, 200, 300];

// добавляем налог 12% и считаем сумму
let totalWithTax = prices
  .map(price => price * 1.12)     // [112, 224, 336]
  .reduce((acc, price) => acc + price, 0);

console.log(totalWithTax); // 672
```

### filter + map + reduce: полный конвейер обработки

```javascript
let students = [
  { name: 'Алия', score: 85 },
  { name: 'Бек', score: 42 },
  { name: 'Чингиз', score: 67 },
  { name: 'Дина', score: 91 },
  { name: 'Эрлан', score: 55 }
];

// средний балл студентов, прошедших порог (>= 60)
let averagePassed = students
  .filter(s => s.score >= 60)            // отсеяли двоечников
  .map(s => s.score)                     // оставили только баллы
  .reduce((acc, s) => acc + s, 0) / students.filter(s => s.score >= 60).length;  // reduce складывает и потом разделили на количество

console.log(averagePassed); // 81
```

### find + includes: поиск с дополнительным условием

```javascript
let words = ['солнце', 'сон', 'соловей', 'сок', 'сом'];

// первый элемент, который начинается на 'сол' И заканчивается на 'ей'
let result = words
  .filter(word => word.startsWith('сол'))
  .find(word => word.endsWith('ей'));

console.log(result); // 'соловей'
```

---

## Асинхронные колбэки

Колбэк может вызываться не сразу, а после завершения асинхронной операции:

```javascript
function fetchData(callback) {
  console.log('Начинаем загрузку данных...');
  setTimeout(() => {
    const data = { name: 'Алия', score: 42 };
    callback(data); // колбэк вызывается через 1 секунду
  }, 1000); // здесь эмулируется то, что загруженные данные приходят через 1 сек.
}

console.log('До вызова fetchData');
fetchData(function(result) {
  console.log('Данные получены:', result);
});
console.log('После вызова fetchData');
```

Обрати внимание на порядок вывода:
1. «До вызова fetchData»
2. «Начинаем загрузку данных...»
3. «После вызова fetchData»
4. (через 1 секунду) «Данные получены: { name: 'Алия', score: 42 }»

Колбэк выполнился **после** того, как основной код уже закончился — в этом суть асинхронности.

---

## Callback Hell (ад колбэков)

При последовательности асинхронных операций возникает глубокая вложенность:

```javascript
function step1(callback) {
  setTimeout(() => {
    console.log('Шаг 1 готов');
    callback('результат1');
  }, 500);
}

function step2(данные, callback) {
  setTimeout(() => {
    console.log('Шаг 2 готов, получил:', данные);
    callback('результат2');
  }, 500);
}

function step3(данные, callback) {
  setTimeout(() => {
    console.log('Шаг 3 готов, получил:', данные);
    callback('результат3');
  }, 500);
}

// Callback Hell — пирамида вложенности
step1(function(р1) {
  step2(р1, function(р2) {
    step3(р2, function(р3) {
      console.log('Финиш!', р3);
    });
  });
});
```

### Проблемы
- Код растёт вправо («пирамида судьбы»)
- Трудно читать и поддерживать

### Решения
1. **Именованные функции** — вынести каждый шаг в отдельную функцию
   ```javascript
   step1(stepAfter1);
   
   function stepAfter1(р1) {
     step2(р1, stepAfter2);
   }
   
   function stepAfter2(р2) {
     step3(р2, stepAfter3);
   }
   
   function stepAfter3(р3) {
     console.log('Финиш!', р3);
   }
   ```
   Плюс: нет вложенности. Минус: код разорван, функции стало больше, функции одноразовые.

---

## Ключевые идеи

- Колбэк — это функция, переданная как значение другой функции
- «Я позвоню тебе позже» — функция-исполнитель решает, когда вызвать колбэк
- Фундаментальная концепция асинхронного программирования в JS
- Без понимания колбэков невозможно понять промисы и async/await
