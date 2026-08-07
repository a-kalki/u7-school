# План реализации — Трек 7: `OnboardingController` — заглушка

---

## Фаза 1: Перенос и отключение

- [ ] Task: Создать структуру `onboarding/` в `apps/u7-bot/src/`
    - [ ] Создать `onboarding/controller.ts`
    - [ ] Создать `onboarding/ui-spec.md` (заглушка: «отложено до metrics»)

- [ ] Task: Перенести `OnboardingController` без изменений
    - [ ] Написать тесты для контроллера (если отсутствуют)
    - [ ] Скопировать логику из `packages/onboarding/src/ui/bot/`
    - [ ] Адаптировать импорты под новое местоположение

- [ ] Task: Отключить кнопку «📝 Заполнить анкету»
    - [ ] В `handleStart()` не возвращать кнопку
    - [ ] Проверить: кнопка не отображается в главном меню

- [ ] Task: Подключить контроллер в `create-ui-app.ts`
    - [ ] Зарегистрировать (контроллер есть в реестре, но без видимой кнопки)

- [ ] Task: Проверить качество
    - [ ] `bun run check` — чисто
    - [ ] Тесты проходят

- [ ] Task: Conductor - User Manual Verification 'Перенос и отключение' (Protocol in workflow.md)

---

## Фаза 2: Зачистка

- [ ] Task: Удалить старые файлы
    - [ ] Удалить `packages/onboarding/src/ui/bot/` (если ничего не осталось)
    - [ ] Проверить, что нет ссылок на старый путь

- [ ] Task: Обновить `conductor/tracks.md` — отметить Трек 7 как выполненный

- [ ] Task: Conductor - User Manual Verification 'Зачистка' (Protocol in workflow.md)
