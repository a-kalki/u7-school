# Функция splice(arr, start, deleteCount, ...items) — удаление и вставка

**Краткое содержание:**
`splice` — самая сложная функция в проекте 6. Она удаляет `deleteCount` элементов начиная с индекса `start` и вставляет на их место новые элементы. Мутабельная — меняет массив на месте. Возвращает массив удалённых элементов.

### Алгоритм

1. Проверить, что `arr` — массив. Иначе `throw new TypeError`
2. Если `start` не передан — `throw new TypeError`
3. Нормализовать `start`: если отрицательный → `len(arr) + start`. Если всё ещё < 0 → 0. Если > `len(arr)` → `len(arr)`
4. Если `deleteCount` не передан — установить `deleteCount = len(arr) - start`
5. Если `deleteCount < 0` → установить `0`
6. Если `deleteCount > len(arr) - start` → обрезать до `len(arr) - start`
7. Создать массив `removed = []` для удалённых элементов
8. Скопировать удаляемые элементы в `removed`: `removed[i] = arr[start + i]`
9. Сдвинуть оставшиеся после удаления элементы **влево** на `deleteCount` позиций: `arr[start + i] = arr[start + deleteCount + i]`
10. Удалить «хвостовые» индексы через `delete` для освободившихся позиций (от `newLength` до старой длины)
11. Если есть `items` для вставки — сдвинуть элементы после `start` **вправо** на `items.length`, затем вставить `items` на место `start`
12. Вернуть `removed`

```javascript
function splice(arr, start, deleteCount, ...items) {
  if (!Array.isArray(arr)) throw new TypeError('Ожидается массив');

  const length = len(arr);

  // Нормализация start
  if (start < 0) start = length + start;
  if (start < 0) start = 0;
  if (start > length) start = length;

  // Нормализация deleteCount
  if (deleteCount === undefined) deleteCount = length - start;
  if (deleteCount < 0) deleteCount = 0;
  if (deleteCount > length - start) deleteCount = length - start;

  // Собираем удаляемые элементы
  const removed = [];
  for (let i = 0; i < deleteCount; i++) {
    removed[i] = arr[start + i];
  }

  const itemsLen = items.length;

  if (itemsLen > deleteCount) {
    // Сдвиг вправо для освобождения места
    const shift = itemsLen - deleteCount;
    for (let i = length - 1; i >= start + deleteCount; i--) {
      arr[i + shift] = arr[i];
    }
  } else if (itemsLen < deleteCount) {
    // Сдвиг влево для заполнения лишних
    const shift = deleteCount - itemsLen;
    for (let i = start + deleteCount; i < length; i++) {
      arr[i - shift] = arr[i];
    }
    // Удаляем хвост
    for (let i = length - shift; i < length; i++) {
      delete arr[i];
    }
  }

  // Вставляем новые элементы
  for (let i = 0; i < itemsLen; i++) {
    arr[start + i] = items[i];
  }

  return removed;
}
```

### Почему это сложная функция

`splice` объединяет две операции — удаление и вставку — в одной функции. Нужно правильно сдвигать элементы и обрабатывать три случая: items больше чем удалено (расширение), items меньше (сжатие), items столько же (замена).

### Мутабельность

`splice` **меняет** массив на месте. В JSDoc отметь это явно.

**Видео:** [p6-l6. Функция splice.mp4](https://drive.google.com/file/d/placeholder)
