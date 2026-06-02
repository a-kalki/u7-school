# Структура данных: ключ-значение (Object, Map)

## Объект (Object)

Объект — коллекция пар «ключ: значение». Ключ — всегда строка (или символ). Используется для хранения именованных коллекций.

### Создание
```javascript
let user = new Object();   // конструктор (редко)
let user = {};             // литерал (основной способ)

let user = {
  name: "John",
  age: 30,
};
```

### Доступ к свойствам

**Через точку** (простой синтаксис, только для допустимых имён):
```javascript
user.name       // John
user.age = 31   // присваивание
delete user.age // удаление
user.isAdmin = true // добавление
```

**Через квадратные скобки** (для произвольных ключей, включая пробелы):
```javascript
user["likes birds"] = true;
let key = "name";
user[key]          // динамический доступ
```

### Вычисляемые свойства
```javascript
let fruit = "apple";
let bag = {
  [fruit]: 5,              // имя свойства берётся из переменной
  [fruit + 'Computers']: 5 // bag.appleComputers = 5
};
```

### Короткая запись свойств
```javascript
function makeUser(name, age) {
  return { name, age };  // то же, что { name: name, age: age }
}
```

### Ограничения имён свойств
- Нет ограничений: можно использовать `for`, `let`, `return` как имена свойств
- Числа преобразуются в строки (`obj[0]` = `obj["0"]`)
- Особый случай: `__proto__` — нельзя присвоить не-объект

### Проверка существования свойства: оператор `in`
```javascript
"age" in user   // true
"blabla" in user // false
```
Используется вместо `user.prop === undefined`, потому что свойство может существовать со значением `undefined`.

### Перебор свойств: for…in
```javascript
for (let key in user) {
  console.log(key, user[key]); // name John, age 30
}
```

### const и объекты
`const user = { name: "John" }` — саму переменную переприсвоить нельзя, но свойства менять можно (`user.name = "Pete"`). `const` защищает переменную, а не содержимое объекта.

---

## Map

Map — коллекция пар ключ-значение, где **ключом может быть любое значение** (объект, число, строка, boolean). В отличие от Object, сохраняет тип ключа.

### Создание и методы
```javascript
let map = new Map();

// из массива пар [ключ, значение]
let map = new Map([
  ['1', 'str1'],
  [1, 'num1'],
  [true, 'bool1']
]);
```

| Метод | Описание |
|---|---|
| `map.set(key, value)` | Запись по ключу. Возвращает map → можно чейнить |
| `map.get(key)` | Возвращает значение или `undefined` |
| `map.has(key)` | Проверяет наличие ключа |
| `map.delete(key)` | Удаляет пару |
| `map.clear()` | Очищает коллекцию |
| `map.size` | Количество элементов |

### Ключи-объекты (главное отличие от Object)
```javascript
let john = { name: "John" };
let map = new Map();
map.set(john, 123);
map.get(john); // 123 — работает!

// В Object: все ключи-объекты приводятся к "[object Object]"
```

### Перебор Map
```javascript
// for..of по умолчанию: пары [ключ, значение]
for (let [key, value] of map) { ... }

map.keys()     // итерируемый объект ключей
map.values()   // итерируемый объект значений
map.entries()  // итерируемый объект пар [ключ, значение]

map.forEach((value, key) => { ... });
```
Перебор идёт в порядке вставки (в отличие от Object, где порядок не гарантирован для числовых ключей).

### Взаимодействие с Object
```javascript
// Object → Map
let map = new Map(Object.entries(obj));

// Map → Object
let obj = Object.fromEntries(map);  // или map.entries()
```

---

## Сравнение Object и Map

| Характеристика | Object | Map |
|---|---|---|
| Тип ключа | Только строка/символ | Любой тип |
| Порядок свойств | Не гарантирован (кроме особых случаев) | Порядок вставки |
| Размер | `Object.keys(obj).length` | `map.size` |
| Производительность | Быстрее для мелких объектов | Оптимизирован для частых добавлений/удалений |
| Итерация | `for...in` + проверка `hasOwnProperty` | Встроенный итератор (for..of) |
| Прототип | Имеет (может мешать) | Нет |

---

## Источники на learn.javascript.ru

- [Объекты](https://learn.javascript.ru/object) — создание, свойства, доступ, for…in, оператор in
- [Map и Set](https://learn.javascript.ru/map-set) — Map: коллекция ключ-значение с любым типом ключа
