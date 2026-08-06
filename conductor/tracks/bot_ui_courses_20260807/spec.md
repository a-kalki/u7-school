# Спецификация: Контроллер `courses` — «Программы курсов»

> **Родительский документ:** [bot-ui-refactoring.md](../../bot-ui-refactoring.md), Трек 4
> **Дорожная карта:** [development-roadmap.md](../../development-roadmap.md), Релиз 1
>
> **Зависимости:** Трек 3 (bot_ui_app_20260807)

## Обзор

Перенос `CourseCatalogStory` из `packages/course/src/ui/bot/` в новый контроллер `courses`. Экран S00: 5-уровневый drill-down по live published данным. Выделение общего рендеринга дерева в `shared/tree-renderer.ts`.

## Функциональные требования

1. Создать `apps/u7-bot/src/courses/controller.ts` — `CoursesController`.
2. Создать `apps/u7-bot/src/courses/ui-spec.md` — документация экранов.
3. Перенести `course-catalog.ts` (S00: курсы → этапы → модули → проекты → уроки → заголовки шагов).
4. Выделить общий рендеринг дерева проект→урок→шаг в MarkdownV2 в `apps/u7-bot/src/shared/tree-renderer.ts`.
5. `tree-renderer.ts` принимает `TreeNode[]` и рендерит в MarkdownV2. Не зависит от источника данных.
6. Заменить `'app:main-menu'` на `this.ui.app.mainMenu()`.
7. Перенести тесты в `apps/u7-bot/tests/courses/`.

## Нефункциональные требования

- `tree-renderer.ts` — чистая функция, без сайд-эффектов
- Все тесты проходят
- `tsc --noEmit` и `biome check` проходят

## Критерии приёмки

- Кнопка «📖 Программы курсов» работает как раньше
- 5-уровневый drill-down: курсы → этапы → модули → проекты → уроки → шаги
- `tree-renderer.ts` используется только в courses, готов к переиспользованию в streams/learning/mentor
- Старый `CourseCatalogStory` удалён из `packages/course/src/ui/bot/`

## За рамками

- Изменения в данных курсов
- Добавление статусов ✅/▶️/🔒 (это в learning, Трек 6)
