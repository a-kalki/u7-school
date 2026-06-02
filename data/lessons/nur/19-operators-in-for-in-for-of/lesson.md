# Операторы in, for…in, for…of

## Оператор `in`

Проверяет существование свойства в объекте:

```javascript
"key" in object
```

```javascript
let user = { name: "John", age: 30 };

"age" in user      // true
"blabla" in user   // false
```

**Зачем нужен, если можно проверить через `undefined`?**
```javascript
let obj = { test: undefined };
obj.test === undefined  // true — но свойство существует!
"test" in obj           // true — правильно
```
Свойство может существовать со значением `undefined` — в этом случае проверка через `=== undefined` даст ложный результат, а `in` — правильный.

---

## Цикл for…in

Перебирает **все перечисляемые свойства объекта**, включая унаследованные.

```javascript
for (let key in object) {
  // key — имя свойства (строка)
  // object[key] — значение свойства
}
```

```javascript
let user = { name: "John", age: 30, isAdmin: true };

for (let key in user) {
  console.log(key);        // name, age, isAdmin
  console.log(user[key]);  // John, 30, true
}
```

### Особенности
- Перебирает **все** перечисляемые свойства, в том числе унаследованные (если они enumerable)
- Рекомендуется проверять `obj.hasOwnProperty(key)`, если есть риск унаследованных свойств
- Не гарантирует порядок перебора (хотя в современных движках строковые ключи идут в порядке создания, а числовые — по возрастанию)
- Подходит **только для объектов**, не для массивов

### for…in с массивами
Технически работает (массив — объект), но **не рекомендуется**:
- Перебирает не только числовые индексы, но и добавленные свойства
- Порядок не гарантирован
- Медленнее, чем `for` или `for...of`

---

## Цикл for…of

Перебирает **значения итерируемого объекта** (массивы, строки, Map, Set, NodeList и т.д.).

```javascript
for (let value of iterable) {
  // value — очередное значение
}
```

### С массивами
```javascript
let fruits = ["Яблоко", "Апельсин", "Слива"];

for (let fruit of fruits) {
  console.log(fruit); // Яблоко, Апельсин, Слива
}
```

### Со строками
```javascript
for (let char of "Hello") {
  console.log(char); // H, e, l, l, o
}
```

### С Map
```javascript
let map = new Map([["a", 1], ["b", 2]]);

for (let [key, value] of map) { ... }   // пары
for (let key of map.keys()) { ... }      // ключи
for (let value of map.values()) { ... }  // значения
```

### С Set
```javascript
for (let value of set) { ... }
```

### Отличия for…of от for…in

| Характеристика | for…in | for…of |
|---|---|---|
| Перебирает | Ключи (имена свойств) | Значения |
| Для чего | Объекты | Итерируемые объекты (массивы, строки, Map, Set) |
| Включает ли унаследованные | Да | Нет |
| Порядок | Не гарантирован | Определён итератором |
| Массивы | Не рекомендуется | Рекомендуется |
| Доступ к индексу | `key` (строка) | Нет прямого доступа |

### Когда что использовать
- **Объект → for…in** (плюс `hasOwnProperty` при необходимости)
- **Массив → for…of** (или классический `for` с индексами)
- **Map/Set → for…of**
- **Строка → for…of**

---

## Источники на learn.javascript.ru

- [Объекты: оператор in, for…in](https://learn.javascript.ru/object#proverka-suschestvovaniya-svoystva-operator-in) — проверка существования свойства и перебор
- [Массивы: for…of](https://learn.javascript.ru/array#perebor-elementov) — перебор значений массива
- [Циклы while и for](https://learn.javascript.ru/while-for) — базовые циклы (отсылает к for…in и for…of)
