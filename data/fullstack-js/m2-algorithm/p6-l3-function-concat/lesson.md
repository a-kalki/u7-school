# Функция concat(arr1, arr2) — объединение массивов

**Краткое содержание:**
`concat(arr1, arr2)` создаёт новый массив из элементов первого, за которыми следуют элементы второго. Иммутабельная — исходные массивы не меняются.

### Алгоритм

1. Проверить типы: `arr1` и `arr2` — массивы. Иначе `throw new TypeError`
2. Создать новый пустой массив `result = []`
3. Скопировать все элементы `arr1` в `result`: цикл по `arr1`, `result[i] = arr1[i]`
4. Скопировать все элементы `arr2` в `result`, начиная с индекса `len(arr1)`: цикл по `arr2`, `result[len(arr1) + i] = arr2[i]`
5. Вернуть `result`

```javascript
function concat(arr1, arr2) {
  if (!Array.isArray(arr1) || !Array.isArray(arr2)) {
    throw new TypeError('Ожидаются массивы');
  }
  const result = [];
  const len1 = len(arr1);
  const len2 = len(arr2);
  for (let i = 0; i < len1; i++) result[i] = arr1[i];
  for (let i = 0; i < len2; i++) result[len1 + i] = arr2[i];
  return result;
}
```

### Иммутабельность

`concat` **не меняет** исходные массивы. В JSDoc отметь, что возвращается новый массив. Это важное отличие от `push`/`pop`/`fill`/`reverse`.

### Зачем concat, если есть push

`push` добавляет элементы **в конец существующего** массива, меняя его. `concat` создаёт **новый** массив, оставляя исходные нетронутыми. Выбор зависит от задачи: нужно сохранить исходные данные или нет.

**Видео:** [p6-l3. Функция concat.mp4](https://drive.google.com/file/d/placeholder)
