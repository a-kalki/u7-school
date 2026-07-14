# План реализации: stream_api_bot_20260601

## Фаза 0: Настройка фасадов и связей

- [ ] Task: Добавить фасады и методы межмодульного взаимодействия
    - [ ] `packages/user/src/domain/facade.ts` — расширить `UserFacade`, добавить метод `updateUserRole(userId, role)`
    - [ ] `packages/user/src/infra/user-in-proc-facade.ts` — реализовать обновление роли
    - [ ] `packages/course/src/infra/course-in-proc-facade.ts` — проверить экспорт `getModuleSnapshot(moduleId)`

- [ ] Task: Conductor - User Manual Verification 'Настройка фасадов' (Protocol in workflow.md)

---

## 1. API-слой (UseCases)

- [ ] Task: Написать тесты для CreateStreamUc
    - [ ] Тест: успешно создает поток через `StreamAr.create` на основе снимка из `CourseFacade`
    - [ ] Тест: проверяет политику `StreamPolicy.canCreate`

- [ ] Task: Реализовать CreateStreamUc
    - [ ] `packages/stream/src/api/stream/create-stream-uc.ts` — класс CreateStreamUc
    - [ ] `packages/stream/src/api/stream/create-stream-uc.test.ts` — тесты

- [ ] Task: Написать тесты для EnrollStudentUc
    - [ ] Тест: успешно зачисляет гостя/кандидата в поток через `StreamStudentAr.enroll`
    - [ ] Тест: обновляет роль зачисленного пользователя до `STUDENT` через `UserFacade`
    - [ ] Тест: выбрасывает ошибку, если пользователь уже STUDENT (политика `canEnroll`)

- [ ] Task: Реализовать EnrollStudentUc
    - [ ] `packages/stream/src/api/student/enroll-student-uc.ts` — класс EnrollStudentUc

- [ ] Task: Написать тесты для CompleteStepUc
    - [ ] Тест: координирует завершение шага через `StreamDs.completeStep`
    - [ ] Тест: возвращает DTO с результатом перехода (шаг/урок/проект/завершено)

- [ ] Task: Реализовать CompleteStepUc
    - [ ] `packages/stream/src/api/student/complete-step-uc.ts` — класс CompleteStepUc

- [ ] Task: Реализовать остальные UseCases
    - [ ] `ActivateStreamUc` — активация потока
    - [ ] `CompleteStreamUc` — завершение потока
    - [ ] `ArchiveStreamUc` — архивация потока
    - [ ] `GetStudentProgressUc` — прогресс студента
    - [ ] `ListStreamsUc` — получение списка потоков с фильтрацией

- [ ] Task: Подключить UseCases в модуль апи
    - [ ] `packages/stream/src/api/module.ts` — зарегистрировать все UseCases в API-модуле

- [ ] Task: Conductor - User Manual Verification 'API-слой' (Protocol in workflow.md)

---

## 2. Слой контроллера (`StreamController`)

- [ ] Task: Написать тесты для StreamController
    - [ ] Тест: обработка команды `/streams` (витрина) возвращает список кнопок
    - [ ] Тест: клик по потоку возвращает подробную карточку
    - [ ] Тест: клик по кнопке записи вызывает `EnrollStudentUc`
    - [ ] Тест: обработка команды `/my_study` для студента возвращает текущий шаг
    - [ ] Тест: клик на "Выполнено" вызывает `CompleteStepUc` и возвращает следующий шаг

- [ ] Task: Реализовать StreamController
    - [ ] `packages/stream/src/ui/bot/controller/stream-controller.ts` — класс StreamController
    - [ ] `packages/stream/src/ui/bot/controller/stream-controller.test.ts` — тесты

- [ ] Task: Conductor - User Manual Verification 'Слой контроллера' (Protocol in workflow.md)

---

## 3. Интеграция в Telegram-бот `u7-bot`

- [ ] Task: Создать StreamHandler в u7-bot
    - [ ] `apps/u7-bot/src/handlers/stream-handler.ts` — создать обработчики команд и колбеков, прокидывающие запросы в `StreamController`
    - [ ] Интегрировать обработчик в `apps/u7-bot/src/bot.ts`

- [ ] Task: Обновить Главное Меню в `top-menu-handler.ts`
    - [ ] Настроить динамический показ кнопки `📖 Моя учёба` только для роли `STUDENT`
    - [ ] Добавить кнопку `📚 Потоки курсов` для всех пользователей
    - [ ] Добавить кнопку `🛠️ Панель ментора` только для ролей `MENTOR`/`ADMIN`

- [ ] Task: Интегрировать StreamController в DI-контейнер
    - [ ] `apps/u7-bot/src/api-app.ts` — импортировать и инициализировать StreamApiModule и StreamController

- [ ] Task: Conductor - User Manual Verification 'Интеграция в бот' (Protocol in workflow.md)

---

## 4. Контроль качества

- [ ] Task: Полная проверка работоспособности системы
    - [ ] `bun test` — все тесты проходят
    - [ ] `bun run lint` — нет ошибок Biome
    - [ ] `bun run tslint` — проверка типов пройдена
    - [ ] Запустить бот локально, пройти ручную верификацию по сценариям Guest, Student и Mentor
