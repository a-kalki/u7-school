# План реализации: stream_mentor_control_20260703

---

## Фаза 1: Проверочное слово (enrollmentKey)

- [x] Task: Domain — поле `enrollmentKey` в StreamSchema и CreateStreamCmd `26e2f99`
    - [ ] Написать тест: StreamSchema принимает enrollmentKey
    - [ ] Написать тест: CreateStreamCmdSchema принимает enrollmentKey
    - [ ] Реализовать: поле `enrollmentKey?: string` в StreamSchema
    - [ ] Реализовать: поле `enrollmentKey?` в CreateStreamCmd + схема
    - [ ] Реализовать: поле `enrollmentKey?` в EnrollStudentCmd + схема

- [ ] Task: API — create-stream-uc сохраняет enrollmentKey
    - [ ] Написать тест: создание потока с enrollmentKey сохраняет поле
    - [ ] Написать тест: создание потока без enrollmentKey — поле undefined
    - [ ] Реализовать: проброс поля в StreamAr.create() и сохранение

- [ ] Task: API — enroll-student-uc проверяет enrollmentKey
    - [ ] Написать тест: зачисление с верным enrollmentKey — успех
    - [ ] Написать тест: зачисление с неверным enrollmentKey — ошибка
    - [ ] Написать тест: зачисление без enrollmentKey, когда у потока нет ключа — успех
    - [ ] Написать тест: зачисление без enrollmentKey, когда у потока есть ключ — ошибка
    - [ ] Реализовать: проверка `stream.enrollmentKey` vs `command.enrollmentKey`

- [ ] Task: UI — шаг 10 в wizard создания потока (create-stream.story.ts)
    - [ ] Написать тест: шаг wizard запрашивает кодовое слово
    - [ ] Написать тест: кнопка «Пропустить» не сохраняет слово
    - [ ] Реализовать: шаг 10, сохранение в состоянии wizard
    - [ ] Реализовать: передача enrollmentKey в create-stream

- [ ] Task: UI — экран проверки кодового слова (enroll.story.ts)
    - [ ] Написать тест: нажатие «Записаться» на потоке с enrollmentKey → запрос слова
    - [ ] Написать тест: верное слово → вызов enroll-student с enrollmentKey
    - [ ] Написать тест: неверное слово, осталось 2 попытки
    - [ ] Написать тест: 3 неверных → возврат к карточке
    - [ ] Написать тест: кнопка «Отмена» → возврат к карточке
    - [ ] Написать тест: поток без enrollmentKey → сразу enroll-student (без запроса)
    - [ ] Реализовать: handleCallback для enrol:enroll, проверка enrollmentKey через moduleApi
    - [ ] Реализовать: handleMessage для приёма слова, подсчёт попыток
    - [ ] Реализовать: передача enrollmentKey в moduleApi.execute('enroll-student', ...)

- [ ] Task: Интеграционные и e2e тесты
    - [ ] Написать: `tests/bot/integration/stream/enrollment-key.integration.test.ts` — создание потока с ключом, запись с ключом, без ключа, неверный ключ
    - [ ] Обновить: `tests/bot/e2e/stream/user-flows.e2e.test.ts` — сценарий записи с кодовым словом

- [ ] Task: Conductor - Ручная верификация 'Проверочное слово'
    - [ ] Проверить: создание потока с кодовым словом через wizard
    - [ ] Проверить: создание потока без кодового слова
    - [ ] Проверить: запись с верным словом
    - [ ] Проверить: запись без слова (свободный поток)
    - [ ] Проверить: 3 неверных попытки → возврат

---

## Фаза 2: Отчисление студента

- [ ] Task: Domain — статус `expelled`, StudentAr.expel(), StudentPolicy.canExpel()
    - [ ] Написать тест: StudentSchema принимает статус 'expelled'
    - [ ] Написать тест: StudentAr.expel() переводит active → expelled
    - [ ] Написать тест: StudentAr.expel() на !== active — исключение
    - [ ] Написать тест: canExpel(mentor-владелец) → true
    - [ ] Написать тест: canExpel(другой-ментор) → false
    - [ ] Написать тест: canExpel(admin) → true
    - [ ] Реализовать: 'expelled' в статусах StudentSchema
    - [ ] Реализовать: StudentAr.expel()
    - [ ] Реализовать: StudentPolicy.canExpel(actor)

- [ ] Task: API — UserFacade в StreamApiModuleResolver
    - [ ] Реализовать: поле `userFacade: UserFacade` в StreamApiModuleResolver
    - [ ] Реализовать: проброс userFacade при создании StreamApiModule

- [ ] Task: API — expel-student-uc
    - [ ] Написать тест: отчисление ментором-владельцем → expelled, -STUDENT
    - [ ] Написать тест: отчисление чужим ментором → 403
    - [ ] Написать тест: отчисление админом → expelled, -STUDENT
    - [ ] Написать тест: запись студента не удаляется (можно найти по uuid)
    - [ ] Реализовать: ExpelStudentCmd + схема + мета
    - [ ] Реализовать: ExpelStudentUc — проверка прав, expel(), removeRole

- [ ] Task: UI — кнопка «Отчислить» в monitor.story.ts
    - [ ] Написать тест: карточка студента содержит кнопку «Отчислить»
    - [ ] Написать тест: нажатие «Отчислить» → запрос подтверждения
    - [ ] Написать тест: подтверждение → вызов expel-student
    - [ ] Написать тест: отмена → возврат к карточке
    - [ ] Реализовать: handleCallback для monitor:expel
    - [ ] Реализовать: подтверждение с кнопками Да/Отмена
    - [ ] Реализовать: вызов moduleApi.execute('expel-student', ...)

- [ ] Task: Интеграционные и e2e тесты
    - [ ] Написать: `tests/bot/integration/stream/expel.integration.test.ts` — отчисление ментором, чужим ментором (403), проверка ролей после
    - [ ] Обновить: `tests/bot/integration/stream/monitor.integration.test.ts` — кнопка «Отчислить» в карточке студента
    - [ ] Обновить: `tests/bot/e2e/stream/user-flows.e2e.test.ts` — сценарий отчисления

- [ ] Task: Conductor - Ручная верификация 'Отчисление студента'
    - [ ] Проверить: отчисление студента ментором-владельцем
    - [ ] Проверить: отчисление недоступно чужому ментору
    - [ ] Проверить: роль STUDENT снята после отчисления
    - [ ] Проверить: запись студента сохранена (статус expelled)

---

## Фаза 3: Детали потока

- [ ] Task: UI — кнопка «Детали» и экран S04 в view-stream.story.ts
    - [ ] Написать тест: карточка потока содержит кнопку «📋 Детали»
    - [ ] Написать тест: кнопка «Детали» на enrollment
    - [ ] Написать тест: кнопка «Детали» на active
    - [ ] Написать тест: кнопка «Детали» на completed
    - [ ] Написать тест: нажатие «Детали» → экран с заполненными полями
    - [ ] Написать тест: экран без заполненных полей → сообщение-заглушка
    - [ ] Написать тест: кнопка «Назад к потоку» → возврат в S02
    - [ ] Реализовать: handleCallback для view-stream:details
    - [ ] Реализовать: #handleDetails — рендеринг расширенных полей
    - [ ] Реализовать: кнопка «📋 Детали» в #buildKeyboard (S02)

- [ ] Task: Интеграционные тесты
    - [ ] Написать: `tests/bot/integration/stream/stream-details.integration.test.ts` — детали на enrollment/active/completed, пустые поля
    - [ ] Обновить: `tests/bot/integration/stream/view-stream.integration.test.ts` — кнопка «Детали» в карточке

- [ ] Task: Conductor - Ручная верификация 'Детали потока'
    - [ ] Проверить: создание потока с заполненной целью/результатом
    - [ ] Проверить: кнопка «Детали» на enrollment
    - [ ] Проверить: кнопка «Детали» на completed
    - [ ] Проверить: поток без доп. полей → заглушка
    - [ ] Проверить: возврат к карточке

---

## Фаза 4: Снятие CANDIDATE при зачислении

- [ ] Task: API — enroll-student-uc снимает CANDIDATE
    - [ ] Написать тест: зачисление пользователя с ролью CANDIDATE → CANDIDATE снята
    - [ ] Написать тест: зачисление пользователя без CANDIDATE → без ошибок
    - [ ] Реализовать: после addRole(STUDENT) → if hasRole(CANDIDATE) → removeRole(CANDIDATE)

- [ ] Task: Интеграционные тесты
    - [ ] Обновить: `tests/bot/integration/stream/enroll.integration.test.ts` — проверка снятия CANDIDATE при зачислении
    - [ ] Обновить: `tests/bot/e2e/stream/user-flows.e2e.test.ts` — сценарий: CANDIDATE записывается → роль CANDIDATE снята

- [ ] Task: Conductor - Ручная верификация 'Зачисление — снятие CANDIDATE'
    - [ ] Проверить: пользователь с ролью CANDIDATE записывается → CANDIDATE снята, STUDENT добавлена
    - [ ] Проверить: пользователь без CANDIDATE записывается → STUDENT добавлена, без ошибок
