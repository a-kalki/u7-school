# План реализации — Трек: Механизм уведомлений userFacade.notify (user-notify_20260902)

## Фаза 1: Механизм уведомлений (модуль user + контроллер user)

- [ ] Task: Написать падающие тесты UC `notify-user`: публикует событие `user.notified {userId, text}`, ничего не мутирует; зарегистрирован в apiApp
- [ ] Task: Реализовать событие `UserNotifiedEvent` (`packages/user/src/domain/user/events.ts`) и UC `notify-user` (`packages/user/src/api/user/`), зарегистрировать в модуле
- [ ] Task: Написать падающие тесты `UserFacade.notify(userId, text)`: делегирует в UC `notify-user` (интерфейс + UserInProcFacade)
- [ ] Task: Реализовать `notify` в `UserFacade` и `UserInProcFacade`
- [ ] Task: Написать падающие тесты стори `notify`: подписка на `user.notified` → резолв `get-user` → `proactiveSender.notify(telegramId, {text})`; пользователь не найден / нет telegramId → лог-ошибка, доставка пропущена, исключение не всплывает
- [ ] Task: Реализовать контроллер `user` + стори `notify` (`apps/u7-bot/src/controllers/user/`), зарегистрировать контроллер в `create-ui-app.ts`
- [ ] Conductor - User Manual Verification 'Механизм уведомлений' (Protocol in workflow.md)

## Фаза 2: Пилот — уход и снятие (#3, #4)

- [ ] Task: Написать падающие тесты UC `drop-student`: самовыход (who=self) → `userFacade.notify` ментору «🚪 Студент X покинул учёбу с потока «Y» по собственному желанию.»
- [ ] Task: Реализовать notify в UC `drop-student` (резолв имени студента и названия потока, текст FR-6)
- [ ] Task: Написать падающие тесты UC `mark-abandoned`: снятие ментором (who=removed) → notify студенту «Ты снят с учёбы с потока «Y» за бездействие и исключён из его группы…»
- [ ] Task: Реализовать notify в UC `mark-abandoned`
- [ ] Task: Чистка `InactivityStory`: удалить notify-ветки #3/#4 и ставшие ненужными резолверы (кнопки #1/#2, их callback'и и кик остаются); обновить тесты стори
- [ ] Conductor - User Manual Verification 'Пилот — уход и снятие' (Protocol in workflow.md)

## Фаза 3: Закрытие потока (#7c/7d), набор (#8), дубль зачисления

- [ ] Task: Написать падающие тесты UC `complete-student`: advanced + последний модуль → notify «🎉 Курс завершён!…»; advanced + место неизвестно → notify «🏁 Модуль завершён!»; advanced + есть следующий / not_advanced → notify не шлётся (кнопочные ветки остаются в HubStory)
- [ ] Task: Реализовать notify в UC `complete-student` (место модуля через `courseFacade.getModulePlace`)
- [ ] Task: HubStory: перестать слать безкнопочные ветки 7c/7d (кнопочные 7a/7b рендерить как раньше); обновить тесты
- [ ] Task: Написать падающие тесты ER `invite-wishers`: notify каждому желающему с текстом FR-6 #8 (дата, ментор, инструкции); событие `wish:invite` больше не публикуется
- [ ] Task: Реализовать notify в ER `invite-wishers`; удалить событие `wish:invite` и стори WishInviteStory
- [ ] Task: Удалить подписку HubStory на `student.enrolled`; дополнить флоу-ответ view-stream инструкцией «Теперь вы можете получить функционал по учёбе, набрав /start и перейдя по кнопке «Моя учёба»»; обновить тесты
- [ ] Conductor - User Manual Verification 'Закрытие потока, набор, зачисление' (Protocol in workflow.md)

## Фаза 4: E2E, документация, финал трека

- [ ] Task: E2E-тесты: самовыход студента (одно уведомление ментору + кик из группы), снятие за бездействие, закрытие потока (поздравление при последнем модуле, кнопка при следующем), открытие набора желающим, зачисление (одно сообщение с инструкцией, без дубля)
- [ ] Task: Обновить `ui-spec.md` (streams: стори WishInviteStory удалена; learning: подписки hub; зачисление), гайды `bot-architecture.md` / `bot-controller.md` (контроллер user), статус этапа A в `tasks-system-implementation.md`
- [ ] Task: Создать `summary.md` трека; отметить трек завершённым в реестре
- [ ] Conductor - User Manual Verification 'E2E и финал' (Protocol in workflow.md)
