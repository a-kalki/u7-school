# Функции values(obj) и entries(obj)

**Краткое содержание:**
Урок посвящён реализации `values(obj)` и `entries(obj)` на основе уже готовой `keys`. Ключевая идея — композиция: не дублируем `for...in`, а переиспользуем `keys`. Это демонстрирует важный принцип DRY (Don't Repeat Yourself).

**Время:** ~18 мин

**Основные темы:**
- Реализация values(obj)
- Реализация entries(obj)
- Вопросы на понимание
- Сохрани изменения

### Источники

- [Функции values и entries.mp4](https://drive.google.com/file/d/placeholder)

### Алгоритм

`values(obj)`:
1. Проверить тип (`typeof obj !== 'object' || obj === null` → `TypeError`)
2. Получить ключи через `keys(obj)`
3. Для каждого ключа взять `obj[ключ]` и добавить в результат через `push`

`entries(obj)`:
1. Проверить тип
2. Получить ключи через `keys(obj)`
3. Для каждого ключа добавить пару `[ключ, obj[ключ]]` в результат через `push`

```javascript
function values(obj) {
  if (typeof obj !== 'object' || obj === null) {
    throw new TypeError('Ожидается объект');
  }

  const result = [];
  const objKeys = keys(obj);
  for (let i = 0; i < len(objKeys); i++) {
    push(result, obj[objKeys[i]]);
  }
  return result;
}

function entries(obj) {
  if (typeof obj !== 'object' || obj === null) {
    throw new TypeError('Ожидается объект');
  }

  const result = [];
  const objKeys = keys(obj);
  for (let i = 0; i < len(objKeys); i++) {
    const key = objKeys[i];
    push(result, [key, obj[key]]);
  }
  return result;
}
```

### Композиция

`values` и `entries` строятся поверх `keys`, а не дублируют `for...in` + `hasOwnProperty`. Если логика `keys` изменится (например, другой порядок) — `values` и `entries` изменятся автоматически. Это принцип DRY.

**Видео:** [Функции values и entries.mp4](https://drive.google.com/file/d/placeholder)
