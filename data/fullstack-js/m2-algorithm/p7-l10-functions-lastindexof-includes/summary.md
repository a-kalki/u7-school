# Функции lastIndexOf(arr, item) и includes(arr, item) — краткая выжимка

- lastIndexOf(arr, item) — индекс последнего вхождения (поиск с конца), или -1
- includes(arr, item) — boolean: есть ли элемент в массиве
- Композиция: includes = indexOf(arr, item) !== -1 — логика поиска не дублируется
- Обе функции не мутируют массив; TypeError на не-массив
- В проекте 5 ты строил includes для строк через indexOf — тот же приём здесь

[Полный конспект](./lesson.md)
