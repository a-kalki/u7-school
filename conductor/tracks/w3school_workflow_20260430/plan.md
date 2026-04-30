# План реализации: Оптимизация воркфлоу w3school

## Фаза 1: Реорганизация и CLI Базис
- [x] Task: Создать структуру папок для CLI и данных внутри пакета. [ab9fca1]
    - [x] Подготовить директории `src/cli`, `src/core`.
    - [x] Настроить точку входа для CLI (bin) в `package.json`.
- [x] Task: Реализовать базовый CLI каркас на Bun. [ea281b9]
    - [x] Написать тесты для парсинга аргументов командной строки.
    - [x] Реализовать обработку команд `status`, `parse`, `enrich`.
- [ ] Task: Conductor - User Manual Verification 'Фаза 1: Реорганизация и CLI Базис' (Protocol in workflow.md)

## Фаза 2: Портирование логики парсинга и обогащения
- [ ] Task: Перенести логику парсинга (из parse_w3s.js) в TypeScript.
    - [ ] Написать юнит-тесты для парсинга HTML-структуры W3Schools.
    - [ ] Реализовать команду `parse` в CLI.
- [ ] Task: Перенести логику обогащения данных (из enrich_syllabus.js) в TypeScript.
    - [ ] Написать тесты для интеграции с ИИ (mocking).
    - [ ] Реализовать команду `enrich` в CLI.
- [ ] Task: Conductor - User Manual Verification 'Фаза 2: Портирование логики парсинга и обогащения' (Protocol in workflow.md)

## Фаза 3: Документация и завершение
- [ ] Task: Создать руководство для ментора (`INSTRUCTIONS.md`).
    - [ ] Описать процесс использования `wget` и команд CLI.
- [ ] Task: Финальная проверка покрытия тестами и линтинг.
- [ ] Task: Conductor - User Manual Verification 'Фаза 3: Документация и завершение' (Protocol in workflow.md)
