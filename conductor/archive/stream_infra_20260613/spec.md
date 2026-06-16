# Спецификация трека: Stream Infra

## Обзор
Подключить реальный `CourseInProcFacade` из пакета `@u7-scl/course` в композиционный корень бота (`apps/u7-bot/src/api-app.ts`) и починить падающие тесты сторис.

**Почему это первый трек:** без `CourseFacade` создание потоков работает с пустым `contentSnapshot` — студентам нечего учить. Тесты сторис падают (13/124) из-за отсутствия `story.init()`.

## Функциональные требования

### Ф1: Подключить CourseInProcFacade
- В `api-app.ts` заменить заглушку `{ getModuleSnapshot: async () => [] }` на экземпляр `CourseInProcFacade`.
- Для этого нужны `ModuleJsonRepo` и `LessonJsonRepo` из пакета `@u7-scl/course/infra`.
- Добавить seed-файлы для модулей и уроков (пустые JSON или тестовые данные).
- После подключения `CreateStreamUc` должен создавать потоки с реальным `contentSnapshot`.

### Ф2: Починить тесты сторис (13 падающих)
- Все 13 тестов в `packages/stream/src/ui/bot/stories/*.story.test.ts` падают с `TypeError: undefined is not an object (evaluating 'this.api.execute')`.
- Причина: тесты создают `new StoryClass()` без вызова `story.init(mockApi)`.
- Нужно добавить `story.init(mockApi)` в каждый тест, где он отсутствует.

## Критерии приёмки
- [ ] `bun test` показывает 0 падающих тестов
- [ ] `CreateStreamUc` получает непустой `contentSnapshot` при создании потока (если модуль существует)
- [ ] Заглушка `courseFacade` убрана из `api-app.ts`

## За рамками
- Наполнение seed-данных реальными модулями
- Интеграция со StepRepo (пока не нужна)
