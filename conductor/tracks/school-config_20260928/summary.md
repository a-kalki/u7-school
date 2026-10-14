# Summary: Школа как конфигурация уровня приложения (school-config)

> Трек завершён 2026-10-14.
> Релиз: `0.2.0` (группа «Школа»).
> Следующий шаг — трек [school-hub](../school-hub_20260928/spec.md).

## Цель трека

Ввести на уровне модуля `app` понятие **«Школа»** — единый источник данных о школе
(имя, описание, адрес, контакты, Telegram-группы), резолвимый из конфигурации приложения.
Расширить `AppResolver` полем `school` и закрыть дженерик `AppResolver` на уровне `app`
(`U7AppResolver`, `U7ModuleResolver`, дефолты в `U7UseCase`/`U7ApiModule`).
Устранить прямое чтение `config.schoolGroup*` и зависимость UI-слоя от `BotConfig`.
Сделать чтение `mode` из `NODE_ENV` строгим (без дефолта), предзаполнить wizard создания
потока студенческой группой школы и предоставить миграционную инструкцию для прода.

## Выполнено по фазам

- **Фаза 1 (core)** — generic `ModuleResolver<TAppResolver extends AppResolver = AppResolver>`
  в `@u7-scl/core/domain`. Написаны тесты типов, сохранена полная обратная совместимость.
- **Фаза 2 (app)** — реализована сущность `School` (`@u7-scl/app/domain`) с валидационной
  схемой `SchoolSchema`, константой `U7_SCHOOL_ID`, статическими полями `U7_SCHOOL_STATIC`,
  фабрикой `createSchool` и константой `TEST_SCHOOL`. Введены `U7AppResolver` (с `school: School`)
  и `U7ModuleResolver`. Закрыты дефолты `U7UseCase` и `U7ApiModule`. Все доменные модули
  (`user`, `course`, `stream`, `wish`, `questionnaire`, `peer-review`) переведены на
  `U7ModuleResolver`.
- **Фаза 3 (apps/u7-bot)** — `BotConfig` переведён на чтение `COMMUNITY_GROUP_*`,
  `STUDENT_GROUP_*` и обязательного `NODE_ENV` (`mode`). `create-api-app.ts` собирает
  `School` и выставляет `mode` в `appResolver`. `create-ui-app.ts` отвязан от `BotConfig`
  (FR-4). Обновлены моки и тесты конфига.
- **Фаза 4 (потребители)** — `AppController` и `CommunityStory` переведены на получение
  `school.communityGroup.url` из `resolve`. `group-handler` переведён на
  `school.communityGroup.id` из `deps.school`. Удалены все прямые обращения к
  legacy `config.schoolGroup*`.
- **Фаза 5 (wizard pre-fill)** — шаги 9 и 10 в `CreateStreamStory` предзаполняются
  данными студенческой группы школы (`school.studentGroup`). Добавлены кнопки «✅ Оставить»
  (`accept-group`, `accept-invite`), сохранены «⏭️ Пропустить» и ручной ввод.
- **Фаза 6 (миграция и документация)** — удалены legacy-переменные из `.env.development`.
  В `CHANGELOG.md` добавлена секция Migration с готовыми значениями для прода и порядком
  выката («env до перезапуска кода»). Обновлены архитектурные руководства в `conductor/code_styleguides/`.
- **Фаза 7 (финал)** — полный прогон гейта качества (`bun run check`), составлен summary.

## Результаты тестирования

- `bun run check`: **2713 pass**, **0 fail**, 6909 проверок `expect()`.
- Добавлено 21 новый модульный тест:
  - `packages/core/src/domain/types.test.ts` (+1)
  - `packages/app/src/domain/school.test.ts` (+8)
  - `packages/app/src/domain/api.test.ts` (+1)
  - `apps/u7-bot/src/config.test.ts` (+6)
  - `apps/u7-bot/src/controllers/app/stories/community.story.test.ts` (+1)
  - `apps/u7-bot/src/controllers/app/app-controller.test.ts` (+1)
  - `apps/u7-bot/src/controllers/mentor/stories/create-stream.test.ts` (+3)
- Регрессий и промежуточных красных тестов нет.

## Ключевые архитектурные решения

1. **Двухуровневые резолверы:** Core остаётся независимым и generic
   (`ModuleResolver<TAppResolver>`), а уровень `app` закрывает специализацию
   (`U7AppResolver`, `U7ModuleResolver`). Доменные модули получают доступ к `school`
   через единый тип.
2. **Чистый UI-слой:** UI больше не импортирует и не зависит от `BotConfig`. Все данные
   поступают через каскад `resolve` (`school`, `adminTelegramIds`, `botAdminUser`).
3. **Строгий Fail-Fast на окружении:** Отсутствие обязательных переменных
   (`NODE_ENV`, `COMMUNITY_GROUP_*`, `STUDENT_GROUP_*`) прерывает запуск процесса при старте
   без скрытых fallback-значений.
