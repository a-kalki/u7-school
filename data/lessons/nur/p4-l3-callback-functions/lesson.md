# Callback-функции (колбэки)

## Определение

Callback (колбэк, функция обратного вызова) — функция, переданная как аргумент в другую функцию, чтобы быть вызванной позже, по завершении определённого действия.

```javascript
function doSomething(callback) {
  // ... какая-то работа ...
  callback(); // вызываем переданную функцию
}

doSomething(function() {
  console.log("Готово!");
});
```

---

## Синхронные колбэки

Функция-колбэк вызывается сразу же, синхронно:

```javascript
function processArray(arr, callback) {
  for (let item of arr) {
    callback(item);
  }
}

processArray([1, 2, 3], item => console.log(item * 2));
// 2, 4, 6
```

Встроенные методы массивов активно используют колбэки:
- `arr.forEach(callback)`
- `arr.map(callback)`
- `arr.filter(callback)`
- `arr.reduce(callback)`
- `arr.find(callback)`

---

## Асинхронные колбэки

Колбэк вызывается не сразу, а после завершения асинхронной операции:

```javascript
function loadScript(src, callback) {
  let script = document.createElement('script');
  script.src = src;
  script.onload = () => callback(null, script);   // успех
  script.onerror = () => callback(new Error(`Ошибка загрузки ${src}`)); // ошибка
  document.head.append(script);
}

loadScript('/my/script.js', function(error, script) {
  if (error) {
    console.error(error);
  } else {
    console.log(`Скрипт ${script.src} загружен`);
  }
});
```

### Error-first callback (колбэк с первым аргументом-ошибкой)

Распространённое соглашение в Node.js и асинхронном JS:
- **Первый аргумент** — ошибка (`null` если успех)
- **Последующие аргументы** — результаты

```javascript
callback(error, result1, result2);
```

---

## Callback Hell (ад колбэков)

При последовательности асинхронных операций возникает глубокая вложенность:

```javascript
loadScript('1.js', function(error, script) {
  if (error) handleError(error);
  else {
    loadScript('2.js', function(error, script) {
      if (error) handleError(error);
      else {
        loadScript('3.js', function(error, script) {
          if (error) handleError(error);
          else {
            // ... пирамида растёт вправо
          }
        });
      }
    });
  }
});
```

### Проблемы
- Код растёт вправо («пирамида судьбы»)
- Трудно читать и поддерживать
- Обработка ошибок дублируется на каждом уровне

### Решения
1. **Именованные функции** — вынести каждый шаг в отдельную функцию
   ```javascript
   loadScript('1.js', step1);
   function step1(error, script) {
     if (error) handleError(error);
     else loadScript('2.js', step2);
   }
   ```
   Плюс: нет вложенности. Минус: код разорван, функции одноразовые.

2. **Промисы (Promises)** — современный способ, следующая тема после колбэков

3. **Async/await** — синтаксический сахар над промисами

---

## Колбэки в современном коде

- Встроенные методы массивов — синхронные колбэки (везде)
- `setTimeout`, `setInterval` — асинхронные колбэки
- `addEventListener` — колбэки для событий
- Старые библиотеки — error-first колбэки
- Новый код — промисы и async/await (но понимание колбэков фундаментально)

---

## Ключевые идеи

- Колбэк — это функция, переданная как значение другой функции
- «Я позвоню тебе позже» — функция-исполнитель решает, когда вызвать колбэк
- Фундаментальная концепция асинхронного программирования в JS
- Без понимания колбэков невозможно понять промисы и async/await

---

## Источники на learn.javascript.ru

- [Колбэки](https://learn.javascript.ru/callbacks) — асинхронные колбэки, error-first callback, адская пирамида вызовов
