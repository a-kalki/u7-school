# План реализации: Регистрация студентов потока 1 (временные скрипты)

## Структура
Все файлы в `apps/u7-bot/src/student-registration/`:
```
student-registration/
├── README.md                       — цель, описание, инструкция по удалению
├── constants.ts                    — хардкод: список, stream UUID, group chat ID
├── register-student.handler.ts     — /register_student [pN-lM]
├── register-student.handler.test.ts
├── register-inactive.handler.ts    — /register_inactive (ADMIN only)
└── register-inactive.handler.test.ts
```

---

## Фаза 1: Константы и хелперы

- [x] Task: Создать `constants.ts` `1c7316a`
    - [x] Константа `STREAM_1_UUID = '8ae94921-8af6-4fb6-ad1d-60bd2f8ee394'`
    - [x] Константа `GROUP_CHAT_ID = '-1003960918937'`
    - [x] Константа `STUDENT_LIST: Array<{ name: string; telegramId: number; uuid: string }>` — 16 записей из maybe-member.md (раздел 6), исключая Nur (админ) и U7 School Bot
    - [x] Тип `StudentEntry = { name: string; telegramId: number; uuid: string }`
    - [x] Функция `findStudentByTelegramId(tgId: number): StudentEntry | undefined` — поиск в STUDENT_LIST
    - [x] Функция `parseLessonLabel(label: string): { projectIndex: number; lessonIndex: number } | null`
        - [x] Формат: `pN-lM`, где N и M — положительные целые
        - [x] Возвращает 0-based индексы (N-1, M-1) или null при неверном формате
    - [x] Функция `findFirstStepId(snapshot: ContentSnapshot, projectIndex: number, lessonIndex: number): string | null`
        - [x] Принимает contentSnapshot потока (из get-stream)
        - [x] Проверяет границы: projectIndex < snapshot.length, lessonIndex < project.lessons.length
        - [x] Возвращает первый stepId из lesson.stepIds[0] или null
    - [x] Функция `buildStepLabel(snapshot: ContentSnapshot, stepId: string): string`
        - [x] Находит шаг в дереве и возвращает человекочитаемую метку: «Шаг 1 / Переменные (p1-l2)»
        - [x] Если шаг не найден — возвращает первые 8 символов UUID

- [ ] Task: Conductor - Ручная верификация 'Фаза 1' (Protocol in workflow.md)

---

## Фаза 2: Обработчик /register_student

- [ ] Task: Создать `register-student.handler.ts`
    - [ ] Экспортирует функцию:
        ```ts
        registerRegisterStudentCommand(
          bot: Composer<BotContext>,
          apiApp: ApiApp<U7BotAppMeta>,
          userFacade: UserFacade,
          logger: Logger,
        ): void
        ```
    - [ ] Регистрирует `bot.command('register_student', ...)` на приватном боте

    - [ ] **Шаг 1: Разрешить пользователя**
        - [ ] Получить `telegramId` из `ctx.from.id`
        - [ ] Вызвать `userFacade.getUserByTelegramId(telegramId)`
        - [ ] Если нет → создать гостя: `userFacade.registerGuest(telegramId, ctx.from.first_name ?? 'Гость', BOT_ADMIN_UUID)`
        - [ ] Если не удалось → `ctx.reply('Не удалось определить пользователя.')`, выход

    - [ ] **Шаг 2: Проверить членство в группе**
        - [ ] Проверить `findStudentByTelegramId(telegramId)` — есть ли в STUDENT_LIST
        - [ ] Если нет в списке → вызвать `ctx.api.getChatMember(GROUP_CHAT_ID, telegramId)`
        - [ ] Извлечь `status` из ответа: должно быть 'member', 'administrator' или 'creator'
        - [ ] Если статус 'left' или 'kicked' → `ctx.reply('❌ Ты не являешься участником группы потока.')`, выход
        - [ ] Если ошибка API → `ctx.reply('⚠️ Не удалось проверить членство в группе. Попробуй позже.')`, выход
        - [ ] Если пользователь в группе, но его нет в STUDENT_LIST → ок, продолжаем (он уже создан как GUEST)

    - [ ] **Шаг 3: Проверить отсутствие активной записи Student**
        - [ ] Получить studentRepo через apiApp (или импортировать StudentJsonRepo)
        - [ ] Вызвать `studentRepo.getByUser(user.uuid)`
        - [ ] Проверить `records.some(r => r.status === 'active' && r.streamId === STREAM_1_UUID)`
        - [ ] Если уже есть активная → `ctx.reply('ℹ️ Ты уже зарегистрирован в потоке. Твой текущий шаг: ...')`, показать шаг и выйти
        - [ ] Проверить `records.some(r => r.status === 'active' && r.streamId !== STREAM_1_UUID)`
        - [ ] Если активен в другом потоке → `ctx.reply('⚠️ Ты уже проходишь обучение в другом потоке.')`, выход

    - [ ] **Шаг 4: Парсить аргумент урока**
        - [ ] Извлечь аргумент из `ctx.message.text` — всё после `/register_student`, trimmed
        - [ ] Если пусто → использовать `'p4-l1'` (по умолчанию)
        - [ ] Вызвать `parseLessonLabel(label)`
        - [ ] Если null → `ctx.reply('❌ Неверный формат урока. Используй: /register_student pN-lM (например p4-l1)')`, выход

    - [ ] **Шаг 5: Найти stepId в contentSnapshot**
        - [ ] Получить поток: `apiApp.execute('get-stream', { streamId: STREAM_1_UUID }, user.uuid)`
        - [ ] Получить contentSnapshot из ответа
        - [ ] Вызвать `findFirstStepId(contentSnapshot, projectIndex, lessonIndex)`
        - [ ] Если null → `ctx.reply('❌ Урок не найден в программе потока. Проверь номер.')`, выход
        - [ ] Вызвать `buildStepLabel(contentSnapshot, stepId)` для красивого сообщения

    - [ ] **Шаг 6: Создать Student запись**
        - [ ] Создать объект Student:
            ```ts
            const student: Student = {
              uuid: crypto.randomUUID(),
              streamId: STREAM_1_UUID,
              userId: user.uuid,
              enrolledAt: new Date().toISOString(),
              status: 'active',
              currentStepId: stepId,
              steps: [{ stepId, status: 'issued', issuedAt: new Date().toISOString() }],
              createdAt: new Date().toISOString(),
            }
            ```
        - [ ] Валидировать через StudentSchema (из @u7-scl/stream/domain)
        - [ ] Сохранить: `studentRepo.save(student)`

    - [ ] **Шаг 7: Добавить роль STUDENT**
        - [ ] Проверить, есть ли уже роль STUDENT у пользователя
        - [ ] Если нет → `userFacade.updateUserRole(user.uuid, Role.STUDENT, BOT_ADMIN_UUID)`
        - [ ] Если ошибка → залогировать, но не прерывать (студент уже создан)

    - [ ] **Шаг 8: Ответ пользователю**
        - [ ] `ctx.reply('🎉 *Ты зарегистрирован в потоке «Основы JS. Синтаксис — 1»!*\n\n📌 Текущее задание: ${stepLabel}\n\nИспользуй кнопку «📖 Моя учёба» для продолжения.', { parse_mode: 'MarkdownV2' })`

    - [ ] **Обработка ошибок**
        - [ ] Все try/catch с логированием через logger.error
        - [ ] Пользователю — дружелюбное сообщение, без технических деталей

- [ ] Task: Conductor - Ручная верификация 'Фаза 2' (Protocol in workflow.md)

---

## Фаза 3: Обработчик /register_inactive

- [ ] Task: Создать `register-inactive.handler.ts`
    - [ ] Экспортирует функцию:
        ```ts
        registerRegisterInactiveCommand(
          bot: Composer<BotContext>,
          apiApp: ApiApp<U7BotAppMeta>,
          userFacade: UserFacade,
          logger: Logger,
        ): void
        ```
    - [ ] Регистрирует `bot.command('register_inactive', ...)` на приватном боте

    - [ ] **Шаг 1: Проверить права ADMIN**
        - [ ] Получить `telegramId` из `ctx.from.id`
        - [ ] Получить пользователя: `userFacade.getUserByTelegramId(telegramId)`
        - [ ] Если нет или нет роли ADMIN → `ctx.reply('⛔ Только администратор может выполнить эту команду.')`, выход (не раскрывать существование команды)

    - [ ] **Шаг 2: Подготовка**
        - [ ] Получить studentRepo
        - [ ] Получить поток: `apiApp.execute('get-stream', { streamId: STREAM_1_UUID }, adminUser.uuid)`
        - [ ] Получить contentSnapshot
        - [ ] Найти stepId для p1-l5: `findFirstStepId(contentSnapshot, 0, 4)` (проект 1, урок 5 = p1-l5)
        - [ ] Если не найден → `ctx.reply('❌ Урок p1-l5 не найден в программе потока.')`, выход

    - [ ] **Шаг 3: Обработка каждого студента из STUDENT_LIST**
        - [ ] Инициализировать счётчики: `added = 0, skipped = 0, errors = 0`
        - [ ] Для каждого `entry` из STUDENT_LIST:
            - [ ] **a. Найти пользователя:**
                - [ ] `const user = await userFacade.getUserByUuid(entry.uuid)`
                - [ ] Если нет → проверить через `ctx.api.getChatMember(GROUP_CHAT_ID, entry.telegramId)`
                - [ ] Если статус member/administrator/creator → создать GUEST: `user = await userFacade.registerGuest(entry.telegramId, entry.name, adminUser.uuid)`
                - [ ] Если статус left/kicked/ошибка → `errors++`, continue
            - [ ] **b. Проверить активную запись:**
                - [ ] `const records = await studentRepo.getByUser(user.uuid)`
                - [ ] Если есть `active` запись в потоке 1 → `skipped++`, continue
                - [ ] Если есть `active` запись в другом потоке → `skipped++`, continue
            - [ ] **c. Создать Student запись:**
                - [ ] Создать объект Student (как в register_student, но currentStepId = stepId для p1-l5)
                - [ ] Валидировать через StudentSchema
                - [ ] `await studentRepo.save(student)`
            - [ ] **d. Добавить роль STUDENT:**
                - [ ] Если нет роли STUDENT → `await userFacade.updateUserRole(user.uuid, Role.STUDENT, adminUser.uuid)`
            - [ ] **e. Обновить счётчики:**
                - [ ] `added++`
            - [ ] **f. Задержка:**
                - [ ] `await new Promise(r => setTimeout(r, 500))` — 500ms между студентами, чтобы не спамить API и дать время на обработку

    - [ ] **Шаг 4: Вывести отчёт**
        - [ ] `ctx.reply('📊 *Регистрация завершена*\n\n✅ Добавлено: ${added}\n⏭️ Пропущено (уже есть): ${skipped}\n❌ Ошибки: ${errors}\n\nВсего в списке: ${STUDENT_LIST.length}', { parse_mode: 'MarkdownV2' })`

    - [ ] **Обработка ошибок**
        - [ ] Каждая итерация в try/catch — ошибка одного студента не прерывает остальных
        - [ ] Логирование каждой ошибки с именем студента

- [ ] Task: Conductor - Ручная верификация 'Фаза 3' (Protocol in workflow.md)

---

## Фаза 4: Интеграция в main.ts

- [ ] Task: Зарегистрировать команды в `apps/u7-bot/src/main.ts`
    - [ ] Добавить импорты:
        ```ts
        import { registerRegisterStudentCommand } from './student-registration/register-student.handler';
        import { registerRegisterInactiveCommand } from './student-registration/register-inactive.handler';
        ```
    - [ ] После `connectRouter(privateBot, router, userFacade, botAdminUuid, loggers)` добавить:
        ```ts
        // ══ ВРЕМЕННО: Регистрация студентов потока 1 ══
        // Удалить после использования. См. student-registration/README.md
        registerRegisterStudentCommand(privateBot, apiApp, userFacade, loggers);
        registerRegisterInactiveCommand(privateBot, apiApp, userFacade, loggers);
        // ══ КОНЕЦ ВРЕМЕННОГО БЛОКА ══
        ```
    - [ ] Убедиться, что `apiApp` доступна в этой области видимости (сейчас она возвращается из `createApiApp`)
    - [ ] Если `apiApp` не экспортируется из `createApiApp` — добавить в возвращаемое значение

- [ ] Task: Проверить, что `createApiApp` возвращает `apiApp`
    - [ ] Прочитать `apps/u7-bot/src/api-app.ts`
    - [ ] Если `apiApp` не возвращается — добавить в возвращаемый объект
    - [ ] Убедиться, что тип `ApiApp<U7BotAppMeta>` доступен для импорта

- [ ] Task: Conductor - Ручная верификация 'Фаза 4' (Protocol in workflow.md)

---

## Фаза 5: README.md

- [ ] Task: Создать `student-registration/README.md`
    - [ ] **Раздел «Цель»**
        - [ ] Объяснить: временные команды для ручной регистрации студентов первого потока
        - [ ] Контекст: студенты попадали в группу через инвайт-ссылку, не все зарегистрированы как STUDENT

    - [ ] **Раздел «Использование»** (для пользователя-человека)
        - [ ] `/register_student [pN-lM]` — самостоятельная регистрация
            - [ ] Пример: `/register_student` (по умолчанию p4-l1)
            - [ ] Пример: `/register_student p2-l3`
            - [ ] Условия: нужно быть участником группы u7-school-1
        - [ ] `/register_inactive` — массовая регистрация (только админ)
            - [ ] Добавляет всех из захардкоженного списка с уроком p1-l5
            - [ ] Выводит статистику

    - [ ] **Раздел «Архитектурные решения»**
        - [ ] Скрипты живут в `apps/u7-bot/src/student-registration/`, изолированы от пакетов
        - [ ] Не используются DDD слои — прямые handler'ы Grammy для минимизации кода
        - [ ] Хардкод-список студентов из `maybe-member.md` (раздел 6) — не меняется
        - [ ] Используются существующие фасады (`userFacade`) и репозитории (`StudentJsonRepo`) для консистентности данных
        - [ ] Student записи создаются по схеме `StudentSchema` из `@u7-scl/stream/domain`
        - [ ] Роль STUDENT добавляется через `userFacade.updateUserRole`

    - [ ] **Раздел «Удаление»** (инструкция для агента)
        - [ ] 1. Удалить папку `apps/u7-bot/src/student-registration/` целиком
        - [ ] 2. В `apps/u7-bot/src/main.ts` удалить блок:
            ```
            // ══ ВРЕМЕННО: Регистрация студентов потока 1 ══
            // ... (3 строки)
            // ══ КОНЕЦ ВРЕМЕННОГО БЛОКА ══
            ```
            И соответствующие импорты в начале файла
        - [ ] 3. В `apps/u7-bot/src/api-app.ts` убрать `apiApp` из возвращаемого значения (если добавляли)
        - [ ] 4. Перезапустить бота: `pm2 restart u7-bot`
        - [ ] 5. Проверить что бот запустился без ошибок: `pm2 logs u7-bot`

- [ ] Task: Conductor - Ручная верификация 'Фаза 5' (Protocol in workflow.md)

---

## Фаза 6: Тесты

- [ ] Task: Тесты для `constants.ts`
    - [ ] `parseLessonLabel('p4-l1')` → `{ projectIndex: 3, lessonIndex: 0 }`
    - [ ] `parseLessonLabel('p1-l5')` → `{ projectIndex: 0, lessonIndex: 4 }`
    - [ ] `parseLessonLabel('p10-l3')` → `{ projectIndex: 9, lessonIndex: 2 }`
    - [ ] `parseLessonLabel('invalid')` → `null`
    - [ ] `parseLessonLabel('p-l1')` → `null`
    - [ ] `parseLessonLabel('p1-l')` → `null`
    - [ ] `findStudentByTelegramId(5167204720)` → Alex
    - [ ] `findStudentByTelegramId(9999999999)` → undefined

- [ ] Task: Тесты для `register-student.handler.ts`
    - [ ] **Сценарий 1: Успешная регистрация с уроком по умолчанию**
        - [ ] Пользователь Alex (в STUDENT_LIST), нет активной записи
        - [ ] Команда `/register_student`
        - [ ] Проверить: создана Student запись с currentStepId = первый шаг p4-l1
        - [ ] Проверить: роль STUDENT добавлена
        - [ ] Проверить: ответ содержит «зарегистрирован»
    - [ ] **Сценарий 2: Успешная регистрация с явным уроком**
        - [ ] Команда `/register_student p2-l3`
        - [ ] Проверить: currentStepId = первый шаг p2-l3
    - [ ] **Сценарий 3: Пользователь не в списке, но в группе**
        - [ ] Мокаем getChatMember → статус 'member'
        - [ ] Команда `/register_student`
        - [ ] Проверить: пользователь создан как GUEST, затем зачислен
    - [ ] **Сценарий 4: Пользователь не в списке и не в группе**
        - [ ] Мокаем getChatMember → статус 'left'
        - [ ] Проверить: отказ с сообщением «не являешься участником»
    - [ ] **Сценарий 5: Уже есть активная запись**
        - [ ] Предварительно создать Student запись
        - [ ] Проверить: отказ с сообщением «уже зарегистрирован»
    - [ ] **Сценарий 6: Неверный формат урока**
        - [ ] Команда `/register_student abc`
        - [ ] Проверить: сообщение о неверном формате

- [ ] Task: Тесты для `register-inactive.handler.ts`
    - [ ] **Сценарий 1: Успешное массовое зачисление**
        - [ ] Админ запускает `/register_inactive`
        - [ ] Мокаем что все 16 студентов без активных записей
        - [ ] Проверить: создано 16 Student записей
        - [ ] Проверить: всем добавлена роль STUDENT
        - [ ] Проверить: отчёт: «Добавлено: 16, Пропущено: 0, Ошибки: 0»
    - [ ] **Сценарий 2: Часть уже имеет активные записи**
        - [ ] Мокаем что 3 студента уже активны
        - [ ] Проверить: отчёт «Добавлено: 13, Пропущено: 3, Ошибки: 0»
    - [ ] **Сценарий 3: Отказ не-админа**
        - [ ] Обычный пользователь запускает `/register_inactive`
        - [ ] Проверить: сообщение «Только администратор»
    - [ ] **Сценарий 4: Пользователь не в системе и не в группе**
        - [ ] Мокаем getChatMember → 'left'
        - [ ] Проверить: +1 в ошибки, продолжение для остальных

- [ ] Task: Общая проверка качества
    - [ ] `bun run lint` — нет ошибок форматирования
    - [ ] `bun run tslint` — нет ошибок типов
    - [ ] `bun test` — все тесты проходят
    - [ ] Покрытие нового кода >80%

- [ ] Task: Conductor - Ручная верификация 'Фаза 6' (Protocol in workflow.md)
