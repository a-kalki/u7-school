# Финальный прогон проекта 9 — краткая выжимка

- Запустить `bun test` — все тесты зелёные (включая функции проектов 1–8)
- Проверить JSDoc на всех 5 функциях: параметры, возврат, throws, особенности
- Проверить совместимость: `keys`/`values`/`entries` используют `push`, `cloneDeep`/`isEqualDeep` используют `keys` и `len`
- Типичные ошибки: `null` в `cloneDeep`, порядок проверок в `isEqualDeep`, `hasOwnProperty` для `{ x: undefined }`
- `git status` — clean, `git log --oneline` — осмысленная история
- Готовимся к PR

[Полный конспект](./lesson.md)
