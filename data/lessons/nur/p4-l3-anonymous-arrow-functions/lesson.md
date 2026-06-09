# Анонимные и стрелочные функции

## Что такое анонимная функция

Анонимная функция — функция без имени. Обычно создаётся как Function Expression:

```javascript
// Function Declaration (именованная)
function sayHi() { alert("Hi"); }

// Function Expression (анонимная)
let sayHi = function() { alert("Hi"); };
```

Анонимные функции часто передаются как аргументы другим функциям (колбэки).

---

## Стрелочные функции (Arrow Functions)

Более короткий и лаконичный синтаксис для Function Expression.

### Базовый синтаксис

```javascript
let func = (arg1, arg2, ...argN) => expression;

// Эквивалентно:
let func = function(arg1, arg2, ...argN) {
  return expression;
};
```

```javascript
let sum = (a, b) => a + b;
sum(1, 2); // 3
```

### Вариации синтаксиса

**Один аргумент — скобки можно опустить:**
```javascript
let double = n => n * 2;
```

**Нет аргументов — скобки обязательны:**
```javascript
let sayHi = () => alert("Hello!");
```

**Многострочное тело — нужны фигурные скобки и `return`:**
```javascript
let sum = (a, b) => {
  let result = a + b;
  return result; // без return вернёт undefined
};
```

### Динамическое создание
```javascript
let age = prompt("Сколько вам лет?", 18);
let welcome = (age < 18) ?
  () => alert('Привет!') :
  () => alert('Здравствуйте!');
welcome();
```

---

## Отличия стрелочных функций от function

| Характеристика | `function` | Стрелочная |
|---|---|---|
| Синтаксис | `function (x) { return x * 2 }` | `x => x * 2` |
| Свой `this` | Да | Нет (берёт из внешнего контекста) |
| Свой `arguments` | Да | Нет |
| Можно использовать как конструктор (`new`) | Да | Нет (будет ошибка) |
| Hoisting | Да (Declaration) / Нет (Expression) | Нет (всегда Expression) |
| Подходит для методов объекта | Да | Не всегда (из-за `this`) |

### Когда использовать стрелочные функции
- Короткие однострочные вычисления
- Колбэки: `arr.map(x => x * 2)`, `arr.filter(x => x > 0)`
- Когда нужно сохранить `this` из внешнего контекста (например, в обработчиках)
- Замыкания

### Когда НЕ использовать
- Методы объекта, которым нужен свой `this`: `{ name: "John", sayHi: () => alert(this.name) }` — не сработает
- Функции-конструкторы (нельзя `new Arrow()`)
- Когда нужен доступ к `arguments`

---

## Два типа стрелочных функций

1. **Без фигурных скобок:** `(...args) => expression`
   - Вычисляет выражение и возвращает результат
   - Неявный `return`

2. **С фигурными скобками:** `(...args) => { body }`
   - Позволяет писать несколько инструкций
   - Требует явного `return` для возврата значения

```js
// Тип 1: неявный return
let add = (a, b) => a + b;

// Тип 2: явный return
let add = (a, b) => {
  console.log(a, b);
  return a + b;
};
```

---

## Источники на learn.javascript.ru

- [Стрелочные функции, основы](https://learn.javascript.ru/arrow-functions-basics) — синтаксис, многострочные стрелки, сравнение с Function Expression
