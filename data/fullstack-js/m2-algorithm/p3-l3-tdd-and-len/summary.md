# TDD и функция len() — краткая выжимка

- TDD: RED (падающий тест) → GREEN (минимальный код) → REFACTOR (улучшение без поломки)
- Почему: код делает то, что нужно; нет лишнего кода; регрессия ловится сразу
- `bun:test`: `describe`, `test`, `expect().toEqual()`, `expect(() => fn()).toThrow()`
- Заглушка `len()` возвращает `undefined` — гарантированно падает на первом тесте
- Граничные случаи: `''` → 0, `'   '` → 3, кириллица `'привет'` → 6
- Исключения: `TypeError` на `123`, `null`, `undefined` — по циклу RED→GREEN для каждого
- Коммит: `git add string-utils/len.js string-utils/len.test.js` → «Реализована функция len(str) через TDD»

[Полный конспект](./lesson.md)
