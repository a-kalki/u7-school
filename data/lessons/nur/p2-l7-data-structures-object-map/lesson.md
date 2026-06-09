# Структура данных: Object (объект)

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

### Object.keys, values, entries
```javascript
const salaries = { Иванов: 500_000, Петрова: 450_000 };
console.log(Object.keys(salaries));    // ['Иванов', 'Петрова']
console.log(Object.values(salaries));  // [500000, 450000]
console.log(Object.entries(salaries)); // [['Иванов', 500000], ['Петрова', 450000]]
```

---

## Источники

- [Объекты на learn.javascript.ru](https://learn.javascript.ru/object)
