# Implementation Plan: Monorepo Transition & w3school Integration

## Phase 1: Preparation & Base Structure [checkpoint: 6002771]
- [x] Task: Initialize Bun Workspaces
    - [x] Создать директории `apps/` и `packages/`
    - [x] Обновить корневой `package.json`, добавив поле `workspaces`
- [x] Task: Migrating current project to `apps/u7-bot`
    - [x] Перенести `src/`, `index.ts`, `tsconfig.json` в `apps/u7-bot/`
    - [x] Создать `package.json` для `apps/u7-bot`
    - [x] Обновить пути и импорты
- [x] Task: Conductor - User Manual Verification 'Preparation & Base Structure' (Protocol in workflow.md)

## Phase 2: w3school Integration
- [ ] Task: Import `w3school` package
    - [ ] Скопировать содержимое из `~/Downloads/w3school` в `packages/w3school`
    - [ ] Очистить пакет от ненужных файлов (старые `.git`, `node_modules`)
- [ ] Task: Configure `packages/w3school`
    - [ ] Настроить `package.json` (имя, версия)
    - [ ] Написать базовый тест для проверки доступности данных в `w3school` (TDD)
- [ ] Task: Conductor - User Manual Verification 'w3school Integration' (Protocol in workflow.md)

## Phase 3: Global Configuration & Validation
- [ ] Task: Unified Configuration
    - [ ] Вынести `biome.json` в корень для общего линтинга
    - [ ] Настроить общие зависимости в корневом `package.json`
- [ ] Task: Validation
    - [ ] Запустить `bun install` для линковки воркспейсов
    - [ ] Запустить `bun run build` для всех пакетов
    - [ ] Запустить `bun run lint` (Biome) по всему монорепозиторию
- [ ] Task: Conductor - User Manual Verification 'Global Configuration & Validation' (Protocol in workflow.md)