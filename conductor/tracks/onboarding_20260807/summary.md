# Итоговый отчёт — Трек 7: `OnboardingController` — заглушка

**Дата:** 2026-08-08

## Цель трека

Перенести `OnboardingController` из `packages/onboarding/src/ui/bot/` в `apps/u7-bot/src/controllers/onboarding/` без изменений логики, отключив кнопку «📝 Заполнить анкету» в главном меню до Релиза 4 (metrics).

## Выполненные задачи

### Фаза 1: Перенос и отключение

1. **Создана структура `onboarding/` в `apps/u7-bot/src/controllers/`**
   - `controller.ts` — контроллер с полной логикой анкеты
   - `controller.test.ts` — 16 unit-тестов
   - `ui-spec.md` — заглушка («отложено до metrics»)

2. **Перенесён `OnboardingController` с адаптацией импортов**
   - Импорты `#domain/*` и `#api/*` заменены на `@u7-scl/onboarding/domain` и `@u7-scl/onboarding/api`
   - Локальный `types.ts` → `@u7-scl/onboarding` (добавлен экспорт `MessageDescription`)

3. **Кнопка «📝 Заполнить анкету» отключена**
   - `handleStart()` возвращает `[]`

4. **Контроллер подключён в `create-ui-app.ts`**
   - Импорт заменён с `@u7-scl/onboarding` на локальный `./controllers/onboarding/controller`

5. **Проверка качества**
   - `tsc --noEmit` — чисто
   - 16 unit-тестов проходят
   - 4 E2E-теста проходят

### Фаза 2: Зачистка

6. **Удалены старые файлы из `packages/onboarding/src/ui/bot/`**
   - `controller/onboarding-controller.ts` — удалён
   - `controller/onboarding-controller.test.ts` — удалён
   - `types.ts` — перемещён на уровень выше: `packages/onboarding/src/ui/types.ts`
   - Директория `ui/bot/` полностью удалена

7. **Обновлены ссылки**
   - `packages/onboarding/src/index.ts` — убран экспорт `OnboardingController`, путь к типам обновлён
   - `apps/u7-bot/tests/e2e/onboarding.e2e.test.ts` — импорт контроллера из нового места, тест адаптирован под отключённую кнопку

## Созданные файлы

| Файл | Описание |
|------|----------|
| `apps/u7-bot/src/controllers/onboarding/controller.ts` | Контроллер onboarding (кнопка отключена) |
| `apps/u7-bot/src/controllers/onboarding/controller.test.ts` | 16 unit-тестов |
| `apps/u7-bot/src/controllers/onboarding/ui-spec.md` | UI-спецификация (заглушка) |

## Изменённые файлы

| Файл | Изменение |
|------|-----------|
| `apps/u7-bot/src/create-ui-app.ts` | Импорт локального контроллера |
| `apps/u7-bot/tests/e2e/onboarding.e2e.test.ts` | Импорт из нового места, адаптация теста |
| `packages/onboarding/src/index.ts` | Убран экспорт контроллера, обновлён путь к типам |
| `conductor/tracks.md` | Трек 7 отмечен как выполненный |

## Удалённые файлы

| Файл | Причина |
|------|---------|
| `packages/onboarding/src/ui/bot/controller/onboarding-controller.ts` | Перенесён в apps/u7-bot |
| `packages/onboarding/src/ui/bot/controller/onboarding-controller.test.ts` | Перенесён в apps/u7-bot |
| `packages/onboarding/src/ui/bot/types.ts` | Перемещён на уровень выше (`ui/types.ts`) |

## Архитектурные решения

- **Контроллер без stories**: `OnboardingController` не использует паттерн `BotUserStory` — логика анкеты вшита напрямую. Полноценный рефакторинг на стори отложен до Релиза 4 (metrics).
- **Кнопка отключена, логика жива**: `handleStart` возвращает `[]`, но `handleCallback('start_questionnaire', ...)` по-прежнему работает. Это позволяет E2E-тестам проверять логику анкеты напрямую.
- **Типы оставлены в пакете onboarding**: `KeyboardDescription`, `MessageDescription` и др. используются как контроллером, так и E2E-тестами, поэтому оставлены в `packages/onboarding/src/ui/types.ts`.

## Отклонения от плана

- **`types.ts` перемещён, а не удалён** — типы используются контроллером и тестами, удалить их можно будет только после полного рефакторинга onboarding в Релизе 4.

## Известные ограничения

- Кнопка «📝 Заполнить анкету» не видна пользователям — onboarding недоступен через UI до Релиза 4.
- Логика анкеты не рефакторилась — осталась в виде приватных методов контроллера.
