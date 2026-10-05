# Функции isMoreOrEqual и isLessOrEqual — краткая выжимка

- Фильтрация тестов: `bun test <файл>`, `bun test <часть имени>`, `bun test -t "<текст описания>"`
- Режимы: `--watch` (автоперезапуск, выход Ctrl+C), `--verbose` (полный стек при ошибке)
- `isMoreOrEqual(a, b)` = isMore(a, b) ИЛИ isEqual(a, b) — переиспользуй готовые функции
- `isLessOrEqual(a, b)` — по аналогии (зеркальные случаи + `TypeError`)
- Пустые строки: `isMoreOrEqual('', '')` → `true` (равны)
- Коммиты: «Реализовать isMoreOrEqual», «Реализовать isLessOrEqual»

[Полный конспект](./lesson.md)
