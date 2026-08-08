# План реализации — Трек 7: `OnboardingController` — заглушка

---

## Фаза 1: Перенос и отключение

- [x] Task: Создать структуру `onboarding/` в `apps/u7-bot/src/` `[230d3d7]`
    - [x] Создать `onboarding/controller.ts`
    - [x] Создать `onboarding/ui-spec.md` (заглушка: «отложено до metrics»)

- [x] Task: Перенести `OnboardingController` без изменений
    - [x] Написать тесты для контроллера (если отсутствуют)
    - [x] Скопировать логику из `packages/onboarding/src/ui/bot/`
    - [x] Адаптировать импорты под новое местоположение

- [x] Task: Отключить кнопку «📝 Заполнить анкету»
    - [x] В `handleStart()` не возвращать кнопку
    - [x] Проверить: кнопка не отображается в главном меню

- [x] Task: Подключить контроллер в `create-ui-app.ts`
    - [x] Зарегистрировать (контроллер есть в реестре, но без видимой кнопки)

- [x] Task: Проверить качество
    - [x] `bun run check` — чисто
    - [x] Тесты проходят

- [ ] Task: Conductor - User Manual Verification 'Перенос и отключение' (Protocol in workflow.md)

---

## Фаза 2: Зачистка

- [ ] Task: Удалить старые файлы
    - [ ] Удалить `packages/onboarding/src/ui/bot/` (если ничего не осталось)
    - [ ] Проверить, что нет ссылок на старый путь

- [ ] Task: Обновить `conductor/tracks.md` — отметить Трек 7 как выполненный

- [ ] Task: Conductor - User Manual Verification 'Зачистка' (Protocol in workflow.md)
