# Тренировка: определяем сложность по коду

**Краткое содержание:**
Урок-практикум: студент определяет сложность абстрактных функций, находит ошибки в чужих оценках и сравнивает алгоритмы. Никакого нового кода — только анализ.

### Задачи A–E: базовые

**Задача A.** Функция считает сумму всех элементов массива:
```javascript
function sum(arr) {
  let total = 0;
  for (let i = 0; i < len(arr); i++) total += arr[i];
  return total;
}
```

**Задача B.** Функция проверяет, есть ли в массиве два элемента с одинаковым значением:
```javascript
function hasDuplicates(arr) {
  for (let i = 0; i < len(arr); i++)
    for (let j = i + 1; j < len(arr); j++)
      if (arr[i] === arr[j]) return true;
  return false;
}
```

**Задача C.** Функция печатает все пары из двух массивов:
```javascript
function allPairs(arr1, arr2) {
  for (let i = 0; i < len(arr1); i++)
    for (let j = 0; j < len(arr2); j++)
      console.log(arr1[i], arr2[j]);
}
```

**Задача D.** Функция считает факториал рекурсивно:
```javascript
function factorial(n) {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}
```

**Задача E.** Функция ищет число в **отсортированном** массиве бинарным поиском (это твоя `binarySearch` из проекта 11):
```javascript
function binarySearch(arr, target) {
  let left = 0, right = len(arr) - 1;
  while (left <= right) {
    const mid = left + Math.floor((right - left) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}
```

### Задача F: посложнее

Решето Эратосфена — находит все простые числа от 2 до N:
```javascript
function primesUpTo(n) {
  const isPrime = [];
  for (let i = 2; i <= n; i++) isPrime[i] = true;
  for (let p = 2; p * p <= n; p++) {
    if (isPrime[p]) {
      for (let multiple = p * p; multiple <= n; multiple += p)
        isPrime[multiple] = false;
    }
  }
  const result = [];
  for (let i = 2; i <= n; i++)
    if (isPrime[i]) push(result, i);
  return result;
}
```

Подсказка: внешний цикл до √n, внутренний — шаг p (не 1). Классический ответ: O(n × log(log n)).

### Задачи H–J: твои сортировки из проекта 11

**Задача H.** Оцени сложность `bubbleSort`:
```javascript
function bubbleSort(arr) {
  const result = slice(arr, 0, len(arr));
  const n = len(result);
  for (let i = 0; i < n - 1; i++)
    for (let j = 0; j < n - 1 - i; j++)
      if (result[j] > result[j + 1]) { /* обмен */ }
  return result;
}
```

**Задача I.** Оцени сложность `quickSort` (в среднем и в худшем случае):
```javascript
function quickSort(arr) {
  const n = len(arr);
  if (n <= 1) return slice(arr, 0, n);
  const pivot = arr[0];
  const less = [];
  const greater = [];
  for (let i = 1; i < n; i++)
    if (arr[i] < pivot) push(less, arr[i]);
    else push(greater, arr[i]);
  return concat(concat(quickSort(less), [pivot]), quickSort(greater));
}
```

**Задача J.** Какова сложность `insertionSort` на **уже отсортированном** массиве? А на массиве в обратном порядке?

### Ответы

1. **A (sum)** — O(n). Один цикл по всем элементам.
2. **B (hasDuplicates)** — O(n²). Вложенный цикл: для каждого i перебираем j от i+1 до n. В худшем случае (дубликатов нет) ~ n²/2 сравнений → O(n²).
3. **C (allPairs)** — O(n×m), где n = len(arr1), m = len(arr2). Если массивы одинаковой длины — O(n²).
4. **D (factorial)** — O(n). n рекурсивных вызовов, каждый делает O(1) работы.
5. **E (binarySearch)** — O(log n). Каждый шаг отбрасывает половину оставшегося диапазона.
6. **F (primesUpTo)** — O(n × log(log n)). Внешний цикл до √n, внутренний шагает с шагом p — суммарно получается n × log(log n).
7. **H (bubbleSort)** — O(n²). Вложенный цикл: внешний n итераций, внутренний в среднем n/2 → O(n²).
8. **I (quickSort)** — O(n log n) в среднем (n элементов × ~log n уровней рекурсии), O(n²) в худшем (отсортированный массив и первый опорный — «меньше» каждый раз пустая, рекурсия глубины n).
9. **J (insertionSort)** — O(n) на отсортированном (внутренний цикл не выполняется), O(n²) в обратном порядке (каждый элемент сдвигает все предыдущие).

### Задача G: найди ошибку

Ниже даны неверные оценки сложности. Найди ошибку и исправь:

**G1.** «`indexOf` — O(n), потому что один цикл по строке.»
> Ошибка: внутри цикла ещё один цикл по подстроке. Правильно: O(n×m) или O(n²) если длина подстроки сравнима с длиной строки.

**G2.** «`splice` — O(1), потому что мы просто удаляем элемент по индексу.»
> Ошибка: после удаления нужно сдвинуть все элементы справа от удалённого на одну позицию влево. Правильно: O(n).

**G3.** «Два последовательных цикла — O(2n).»
> Ошибка: константа 2 отбрасывается. Правильно: O(n).

### На каком объёме данных разница станет заметна

Представь: алгоритм A работает за 0.001 × n секунд, алгоритм B — за 0.000001 × n² секунд (B быстрее на малых n за счёт константы). При каком n алгоритм A обгонит B?

Решение: 0.001n < 0.000001n² → n > 1000. На 1000 элементах они сравняются, дальше O(n) выигрывает.

Мораль: при маленьких n константа может перевешивать, но при больших n **порядок роста решает всё**.

**Видео:** [Тренировка — определение сложности.mp4](https://drive.google.com/file/d/placeholder)
