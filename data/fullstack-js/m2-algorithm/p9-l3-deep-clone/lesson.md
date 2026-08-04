# Глубокое копирование: cloneDeep(obj)

**Краткое содержание:**
Урок вводит различие между поверхностным и глубоким копированием. Студент реализует `cloneDeep` — рекурсивную функцию, создающую полную копию объекта или массива со всеми уровнями вложенности. Это первый опыт рекурсии для структур данных в рамках модуля.

### 1. Поверхностное vs глубокое копирование

**Присваивание не копирует:**
```javascript
const original = { name: 'Анна', scores: [5, 4, 5] };
const copy = original;           // это НЕ копия — это вторая ссылка на ТОТ ЖЕ объект
copy.name = 'Борис';
console.log(original.name);      // 'Борис' — original изменился!
```

**Поверхностное копирование** — копирует только первый уровень. Вложенные объекты/массивы остаются общими:
```javascript
const original = { name: 'Анна', scores: [5, 4, 5] };
const shallow = {};
const objKeys = keys(original);
for (let i = 0; i < len(objKeys); i++) {
  shallow[objKeys[i]] = original[objKeys[i]];
}
shallow.name = 'Борис';
shallow.scores[0] = 3;
console.log(original.name);        // 'Анна' — OK, строка скопировалась
console.log(original.scores[0]);   // 3 — НЕ OK, массив остался общим!
```

**Глубокое копирование** — рекурсивно копирует все уровни. Изменение копии нигде не затрагивает оригинал.

### 2. Алгоритм cloneDeep

Функция принимает значение любого типа и возвращает его глубокую копию:

1. **Примитивы** (число, строка, булево, undefined) — вернуть как есть. Они и так «копируются» при присваивании.
2. **null** — вернуть `null`. Важно: `typeof null === 'object'`, поэтому проверяем `null` до проверки на объект.
3. **Массив** — создать новый массив, рекурсивно склонировать каждый элемент.
4. **Объект** — создать новый объект, рекурсивно склонировать каждое значение.

```javascript
function cloneDeep(value) {
  // 1. Примитивы и null
  if (value === null) return null;
  if (typeof value !== 'object') return value;

  // 2. Массив
  if (Array.isArray(value)) {
    const result = [];
    for (let i = 0; i < len(value); i++) {
      result[i] = cloneDeep(value[i]);
    }
    return result;
  }

  // 3. Объект
  const result = {};
  const objKeys = keys(value);
  for (let i = 0; i < len(objKeys); i++) {
    const key = objKeys[i];
    result[key] = cloneDeep(value[key]);
  }
  return result;
}
```

### 3. Порядок проверок важен

Порядок условий в `cloneDeep` имеет значение:

1. Сначала `null` — потому что `typeof null === 'object'`, без этой проверки мы пойдём в ветку объекта и попытаемся вызвать `keys(null)`, что выбросит `TypeError`.
2. Потом примитивы — `typeof value !== 'object'` отсеивает числа, строки, булевы, undefined.
3. Потом массив — `Array.isArray(value)`. Массив — это тоже объект, поэтому проверяем до общей ветки объекта.
4. Наконец, объект — всё, что осталось.

### 4. Как тестировать cloneDeep

Ключевой тест для глубокого копирования — проверка, что изменение копии НЕ затрагивает оригинал на любом уровне:

```javascript
test('изменение копии не затрагивает оригинал', () => {
  const original = {
    name: 'Анна',
    scores: [5, 4, 5],
    address: { city: 'Москва', street: 'Тверская' },
  };
  const copy = cloneDeep(original);

  // Меняем копию на всех уровнях
  copy.name = 'Борис';
  copy.scores[0] = 3;
  copy.address.city = 'Питер';

  // Оригинал не должен измениться
  expect(original.name).toBe('Анна');
  expect(original.scores[0]).toBe(5);
  expect(original.address.city).toBe('Москва');
});
```

### 5. Граничные случаи

- `cloneDeep(42)` → `42` (примитив)
- `cloneDeep('hello')` → `'hello'` (примитив)
- `cloneDeep(null)` → `null`
- `cloneDeep(undefined)` → `undefined`
- `cloneDeep([])` → `[]` (новый пустой массив, не тот же самый)
- `cloneDeep({})` → `{}` (новый пустой объект)
- `cloneDeep([1, [2, [3]]])` — все три уровня вложенности скопированы
- `cloneDeep({ a: { b: { c: 1 } } })` — все три уровня скопированы

**Видео:** [p9-l3. Глубокое копирование cloneDeep.mp4](https://drive.google.com/file/d/placeholder)
