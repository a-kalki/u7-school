# Финальный прогон проекта 11 — краткая выжимка

- `bun test` — все тесты зелёные (включая функции прошлых проектов)
- JSDoc у всех 5 функций: `@param`, `@returns`, `@throws`, особенности
- Ручная проверка цепочки: `keys` → `values` → `entries` → `cloneDeep` → `isEqualDeep`
- `cloneDeep` — отдельная проверка `null` до `typeof`, копирование вложенных структур
- `isEqualDeep` — различает `{ x: undefined }` и `{}` через `hasOwnProperty`
- `git status` — clean, история коммитов осмысленная

[Полный конспект](./lesson.md)
