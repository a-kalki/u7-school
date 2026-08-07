# Трек 7: `OnboardingController` — заглушка

**Контекст:** [bot-ui-refactoring.md](../../bot-ui-refactoring.md#трек-7-onboarding--заглушка)

---

## 1. Обзор

Перенести `OnboardingController` из `packages/onboarding/src/ui/bot/` в `apps/u7-bot/src/onboarding/` **без изменений**. Кнопка главного меню `📝 Заполнить анкету` отключается (не возвращается из `handleStart`).

Полноценный рефакторинг onboarding на стори — в рамках трека metrics (Релиз 4).

## 2. Функциональные требования

### 2.1. Перенос без изменений

- Перенести `OnboardingController` как есть в `apps/u7-bot/src/onboarding/controller.ts`
- Перенести сопутствующие файлы (если есть) из `packages/onboarding/src/ui/bot/`

### 2.2. Отключение кнопки

- В `handleStart()` (или эквивалентном методе) не возвращать кнопку `📝 Заполнить анкету`
- Контроллер остаётся в реестре, но невидим для пользователей

### 2.3. Зависимость от Трека 1

- Нужен `U7BotController` в новом месте (`apps/u7-bot/src/`), уже выполнен

## 3. Нефункциональные требования

- `tsc --noEmit` и `biome check` — чисто
- Тесты перенесены и проходят

## 4. Критерии приёмки

- [ ] `OnboardingController` в `apps/u7-bot/src/onboarding/controller.ts`
- [ ] Кнопка `📝 Заполнить анкету` не отображается в главном меню ни для кого
- [ ] `packages/onboarding/src/ui/bot/` освобождён для удаления в Треке 8
- [ ] Тесты перенесены и проходят

## 5. За рамками

- Рефакторинг onboarding на стори (будет в треке metrics)
- Изменения в доменном слое onboarding
