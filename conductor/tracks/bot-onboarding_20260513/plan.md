# План реализации: Telegram-бот onboarding

> Источник анкеты и правил ветвления: [questionnaire-requirements.md](./questionnaire-requirements.md)

## Фаза 0: Рефакторинг домена onboarding
> Цель: привести доменную модель к архитектуре с пулом вопросов и нормализованными ответами.

- [ ] Task: Создать домен `domain/question-pool/`:
  - `question.ts` — схема и тип `Question`, агрегат `QuestionAr`.
  - `answer-option.ts` — value-object `AnswerOption`.
  - `question-repo.ts` — интерфейс `QuestionRepo`.
  - Сиды/конфиг текущего диалога из [questionnaire-requirements.md](./questionnaire-requirements.md).
- [ ] Task: Перенести файлы со схемами ответов (`source.ts`, `experience.ts`, `goals.ts`, `intensity.ts`, `base-days.ts`, `base-time.ts`, `intensive-time.ts`, `format.ts`) из `domain/application/` в `domain/question-pool/answer-types/`.
- [ ] Task: Создать `domain/application/application-answer.ts` — сущность `ApplicationAnswer` (uuid, applicationUuid, questionUuid, optionCodes, textValue).
- [ ] Task: Переработать `ApplicationAr`:
  - Убрать жёсткую структуру `ApplicationAnswers`.
  - `Application` хранит только метаданные: uuid, userId, status, createdAt, submittedAt.
  - Добавить метод `addAnswer(questionUuid, optionCodes, textValue?)`.
- [ ] Task: Переработать `CreateApplicationCmd` — принимать `ApplicationAnswer[]` вместо `ApplicationAnswers`.
- [ ] Task: Реализовать `QuestionPoolRepo` (JSON-реализация).
- [ ] Task: Написать тесты на QuestionAr, AnswerOption, ApplicationAnswer.
- [ ] Task: Conductor — User Manual Verification 'Рефакторинг домена' (Protocol in workflow.md)

## Фаза 1: Инфраструктура бота
- [ ] Task: Авторегистрация бота в @u7/user: если бота нет в БД, регистрируем через .env `adminTelegramId` как SYSTEM-пользователя с ролью ADMIN
- [ ] Task: Установить @grammyjs/conversations
- [ ] Task: Настроить .env.development, .env.production (BOT_TOKEN, NEWS_GROUP_LINK)
- [ ] Task: Настроить Bot instance, session middleware (JSON storage), error handler
- [ ] Task: Создать app объект с дженериком для типизации команд UC
- [ ] Task: Определить архитектуру: handlers напрямую через app или отдельный controller слой
- [ ] Task: Написать тесты инфраструктуры (app, config)
- [ ] Task: Conductor — User Manual Verification 'Инфраструктура' (Protocol in workflow.md)

## Фаза 2: /start и меню
- [ ] Task: Реализовать /start handler (GetUserByTelegramIdUc / RegisterUserUc)
- [ ] Task: Inline-меню: «Быть в курсе» / «Стать студентом»
- [ ] Task: Реализовать логику повторного /start (candidate / subscriber / guest)
- [ ] Task: Handler «Быть в курсе» — показ ссылки на группу
- [ ] Task: Написать тесты
- [ ] Task: Conductor — User Manual Verification 'Меню' (Protocol in workflow.md)

## Фаза 3: Conversation опросник
> Опросник получает вопросы из Question Pool (`isActive = true`, сортировка по `order`), а не из хардкода.

- [ ] Task: Создать `GetCurrentQuestionnaireUc` — возвращает активный диалог из Question Pool.
- [ ] Task: Создать conversation для анкеты, используя `GetCurrentQuestionnaireUc`.
- [ ] Task: Inline-клавиатуры: множественный выбор с ✅
- [ ] Task: Одиночный выбор
- [ ] Task: Ветвление (base/intensive) — на основе `condition` в Question.
- [ ] Task: Предпросмотр + кнопки «Отправить» / «Изменить ответы»
- [ ] Task: Реализовать «Изменить ответы» — возврат к нужному шагу
- [ ] Task: /cancel handler (удаляет session data, возвращает в меню)
- [ ] Task: Написать тесты
- [ ] Task: Conductor — User Manual Verification 'Conversation' (Protocol in workflow.md)

## Фаза 4: Интеграция с доменом
> CreateApplicationUc создаёт заявку и нормализованные ApplicationAnswer, а не монолитный JSON ответов.

- [ ] Task: Интеграция `CreateApplicationUc` через app объект (новая структура с `ApplicationAnswer[]`).
- [ ] Task: Интеграция `AddRoleToUserUc` (CANDIDATE) — через ApplicationDs.
- [ ] Task: Выдача ссылки на группу по завершению анкеты.
- [ ] Task: Написать интеграционные тесты.
- [ ] Task: Conductor — User Manual Verification 'Интеграция' (Protocol in workflow.md)

## Фаза 5: Финал
- [ ] Task: Проверить покрытие
- [ ] Task: Проверить lint и tsc
- [ ] Task: Обновить README бота и onboarding-пакета
- [ ] Task: Conductor — User Manual Verification 'Финал' (Protocol in workflow.md)
