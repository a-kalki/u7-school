# Структура данных: Map и Set

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
Перебор идёт в порядке вставки.

### Взаимодействие с Object
```javascript
// Object → Map
let map = new Map(Object.entries(obj));

// Map → Object
let obj = Object.fromEntries(map);
```

---

## Set

Set — коллекция **уникальных** значений (без ключей). Каждое значение может появляться только один раз.

### Создание
```javascript
let set = new Set();                    // пустое
let set = new Set(["a", "b", "a"]);     // Set { "a", "b" } — дубликаты удалены
```

### Методы
- `set.add(value)` — добавляет значение (если уже есть — ничего не делает), возвращает set
- `set.delete(value)` — удаляет, возвращает `true` если было
- `set.has(value)` — возвращает `true/false` (работает за O(1))
- `set.clear()` — очищает
- `set.size` — количество элементов

### Перебор
```javascript
for (let value of set) { ... }
set.forEach(value => { ... });
```

### Типичные применения
- Удаление дубликатов из массива: `[...new Set(arr)]`
- Быстрая проверка наличия (`has`)

---

## Сравнение Object и Map

| Характеристика | Object | Map |
|---|---|---|
| Тип ключа | Только строка/символ | Любой тип |
| Порядок свойств | Не гарантирован | Порядок вставки |
| Размер | `Object.keys(obj).length` | `map.size` |
| Итерация | `for...in` + проверка `hasOwnProperty` | Встроенный итератор (for..of) |

---

## Источники

- [Map и Set на learn.javascript.ru](https://learn.javascript.ru/map-set)
