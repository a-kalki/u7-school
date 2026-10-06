# Финал проекта: прогон, PR и код-ревью — краткая выжимка

- Сквозной сценарий: URL → parseUrl/getQueryParams → groupBy → toCSV → fromCSV (round-trip в памяти)
- Полный прогон `bun test` — все тесты репозитория зелёные
- Проверка JSDoc на 5 бизнес-утилитах: `getQueryParams`, `parseUrl`, `groupBy`, `toCSV`, `fromCSV`
- **Ветка:** `feat/business-utils`
- Пуш: `git push -u origin feat/business-utils`
- PR-шаблон: заголовок «Проект «Бизнес-утилиты»: query, URL, группировка, CSV»
- 2 ревьюера + сообщение в чат; ревью-цикл и мерж — по накатанной
- Дальше — проект «HTTP-сервис»: файлы и собственный сервер

[Полный конспект](./lesson.md)
