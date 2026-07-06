# includes, startsWith, endsWith — краткая выжимка

- **includes(str, search):** использовать `indexOf(str, search) !== -1`. Возвращает `boolean`
- **startsWith(str, search):** посимвольно сравнить начало `str` (первые `len(search)` символов) с `search`. Пустой `search` → `true`
- **endsWith(str, search):** посимвольно сравнить конец `str` (последние `len(search)` символов) с `search`. Смещение: `offset = len(str) - len(search)`
- Все три функции выбрасывают `TypeError` если аргументы не string
- `includes` импортирует `indexOf` — переиспользование кода

[Полный конспект](./lesson.md)
