# Функции isMoreOrEqual и isLessOrEqual

**Краткое содержание:**
Урок завершает группу функций сравнения строк. `isMoreOrEqual` и `isLessOrEqual` — комбинации уже написанных функций. Студент реализует их через композицию существующих `isMore`, `isLess` и `isEqual`.

---

### 1. Функция isMoreOrEqual(a, b)

**Задача:** вернуть `true`, если строка `a` лексикографически больше ИЛИ равна строке `b`.

**Алгоритм:** использовать готовые функции. `a >= b` в лексикографическом смысле означает: `a` больше `b` ИЛИ `a` равна `b`.

```javascript
function isMoreOrEqual(a, b) {
  return isMore(a, b) || isEqual(a, b);
}
```

#### Тестовые случаи для isMoreOrEqual

| Случай | Входные данные | Ожидаемый результат |
|--------|---------------|---------------------|
| Больше | `isMoreOrEqual('cat', 'car')` | `true` |
| Равны | `isMoreOrEqual('hello', 'hello')` | `true` |
| Меньше | `isMoreOrEqual('car', 'cat')` | `false` |
| Длиннее (символы совпадают) | `isMoreOrEqual('hello!', 'hello')` | `true` |
| Короче (символы совпадают) | `isMoreOrEqual('hello', 'hello!')` | `false` |
| Пустые строки | `isMoreOrEqual('', '')` | `true` |
| Не строка | `isMoreOrEqual(123, 'hello')` | `TypeError` |

---

### 2. Функция isLessOrEqual(a, b)

**Задача:** вернуть `true`, если строка `a` лексикографически меньше ИЛИ равна строке `b`.

**Алгоритм:** аналогично — `a <= b` означает: `a` меньше `b` ИЛИ `a` равна `b`.

```javascript
function isLessOrEqual(a, b) {
  return isLess(a, b) || isEqual(a, b);
}
```

Альтернативно можно использовать отрицание `isMore`:

```javascript
function isLessOrEqual(a, b) {
  return !isMore(a, b);
}
```

Оба способа эквивалентны — выбери тот, который понятнее.

#### Тестовые случаи для isLessOrEqual

| Случай | Входные данные | Ожидаемый результат |
|--------|---------------|---------------------|
| Меньше | `isLessOrEqual('car', 'cat')` | `true` |
| Равны | `isLessOrEqual('hello', 'hello')` | `true` |
| Больше | `isLessOrEqual('cat', 'car')` | `false` |
| Короче | `isLessOrEqual('hello', 'hello!')` | `true` |
| Пустые строки | `isLessOrEqual('', '')` | `true` |
| Не строка | `isLessOrEqual(123, 'hello')` | `TypeError` |

---

### Сводка: все 7 функций сравнения

| Функция | Что делает | Выражается через |
|---------|-----------|-----------------|
| `len(str)` | Длина строки | — |
| `isEqual(a, b)` | Строгое равенство | — |
| `isNotEqual(a, b)` | Неравенство | `!isEqual(a, b)` |
| `isMore(a, b)` | Строго больше | — |
| `isLess(a, b)` | Строго меньше | `!isMore(a, b) && !isEqual(a, b)` |
| `isMoreOrEqual(a, b)` | Больше или равно | `isMore(a, b) \|\| isEqual(a, b)` |
| `isLessOrEqual(a, b)` | Меньше или равно | `!isMore(a, b)` |

---

**Видео:** [p1-l8. Функции isMoreOrEqual и isLessOrEqual.mp4](https://drive.google.com/file/d/placeholder)
