# repeat(str, count) — краткая выжимка

- **Алгоритм:** цикл `count` раз, добавляем `str` к результату
- `count` приводится к целому через `Math.floor` (как в стандартном JS)
- `count === 0` → `''`
- `count < 0` → `RangeError`
- `count` не число → `TypeError`
- `str` не строка → `TypeError`
- TDD: заглушка `return ''`, тесты, реализация

[Полный конспект](./lesson.md)
