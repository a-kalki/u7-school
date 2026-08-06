# План реализации: Контроллер `courses` — «Программы курсов»

> **Трек:** `bot_ui_courses_20260807`
> **Родительский документ:** [bot-ui-refactoring.md](../../bot-ui-refactoring.md), Трек 4
>
> **Зависимости:** `bot_ui_app_20260807`

---

## Фаза 1: Тесты (Red) — Тесты на текущее поведение

- [ ] Task: Зафиксировать поведение `CourseCatalogStory` тестами
    - [ ] Тест: drill-down курсы → этапы (правильное количество уровней)
    - [ ] Тест: drill-down этап → модули
    - [ ] Тест: drill-down модуль → проекты → уроки → шаги
    - [ ] Тест: кнопка «Назад» на каждом уровне
    - [ ] Тест: кнопка «📖 Программы курсов» в главном меню
- [ ] Task: Conductor - User Manual Verification 'Фаза 1: Тесты' (Protocol in workflow.md)

## Фаза 2: Реализация (Green) — Перенос и выделение tree-renderer

- [ ] Task: Создать `apps/u7-bot/src/shared/tree-renderer.ts`
    - [ ] Тип `TreeNode`
    - [ ] Функция `renderTree(nodes: TreeNode[]): string` — рендеринг в MarkdownV2
    - [ ] Чистая функция, без зависимостей от доменов
- [ ] Task: Создать `apps/u7-bot/src/courses/controller.ts`
    - [ ] Класс `CoursesController extends U7BotController`
    - [ ] Обработчик кнопки «📖 Программы курсов»
- [ ] Task: Перенести `course-catalog.ts` (S00)
    - [ ] Drill-down: курсы → этапы → модули → проекты → уроки → шаги
    - [ ] Использовать `tree-renderer.ts` для рендеринга дерева
    - [ ] Заменить `'app:main-menu'` на `this.ui.app.mainMenu()`
- [ ] Task: Удалить старые файлы
    - [ ] `packages/course/src/ui/bot/course-catalog.story.ts`
    - [ ] `packages/course/src/ui/bot/course-controller.ts`
- [ ] Task: Conductor - User Manual Verification 'Фаза 2: Реализация' (Protocol in workflow.md)

## Фаза 3: Рефакторинг

- [ ] Task: Оптимизировать tree-renderer
    - [ ] Проверить, что `tree-renderer.ts` готов к переиспользованию (streams, learning, mentor)
    - [ ] Убедиться в отсутствии жёстких зависимостей от course
- [ ] Task: Conductor - User Manual Verification 'Фаза 3: Рефакторинг' (Protocol in workflow.md)

## Фаза 4: Проверка качества и документация

- [ ] Task: Прогнать полную проверку качества
    - [ ] `bun run check` — biome + tsc + тесты
    - [ ] `bun test --coverage` — покрытие >80%
- [ ] Task: Создать `apps/u7-bot/src/courses/ui-spec.md`
- [ ] Task: Conductor - User Manual Verification 'Фаза 4: Качество' (Protocol in workflow.md)
