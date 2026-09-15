# Changelog

Все заметные изменения проекта документируются в этом файле.
Формат — [Keep a Changelog](https://keepachangelog.com/ru/1.1.0/),
версионирование — [SemVer](https://semver.org/lang/ru/).

Перед релизом: добавить секцию `## [X.Y.Z] — YYYY-MM-DD` наверх
(наличие секции проверяет `scripts/release.sh`). Группировка:
Added / Changed / Fixed / Migration.

## [0.1.0] — 2026-09-15

Первый тегированный релиз — точка отсчёта для деплоя и откатов.
До этого версии не фиксировались (деплой «push → git pull на сервере»).

В запись сведены основные изменения последних месяцев: перевод bot-ui
на контракт «Диалог и Экран», актор-объект User, персистентность сессий
бота.

### Added

- **Контракт «Диалог и Экран» для bot-ui**: единый `DialogResponse`
  (экран + клавиатура + состояние диалога) вместо разнородных ответов;
  на контракт переведены все стори — learning, questionnaire, mentor,
  community, каталоги курсов и потоков.
- **Билдеры ответов** `screen / ask / warn / note / go / kb / btn / btnUrl`
  — чистые функции сборки `DialogResponse`.
- **Персистентность сессий бота** (рестарт сервиса больше не сбрасывает
  диалоги):
  - порт `BotSessionRepo` в core — без деталей хранилища;
  - реализация `JsonBotSessionRepo` — файлы `data/bot/sessions.json` и
    `data/bot/short-ids.json` с Valibot-валидацией; битый файл — fail-fast
    на старте, без молчаливых пересозданий;
  - `restore()` до старта polling: `seq`, `ScreenState.messageId`,
    `input.context` и разворот shortId → UUID переживают рестарт;
  - синхронная запись сессии после каждого обработанного апдейта
    (command / callback / message / invite).
- **Актор-объект `User`** вместо `actorId` в UseCase/ApiModule/ApiApp
  и во всех доменах (user, wish, questionnaire, course, stream)
  и приложениях.
- Dev-фикстуры: пересев `seed:fixtures` сбрасывает сессии бота.
- **Релизный процесс**: `scripts/release.sh` (гейты, bump версии,
  аннотированный тег, пуш), `scripts/deploy.sh` на сервере (бэкап →
  checkout тега → pm2 → smoke-check), метаданные версии в каждом бэкапе
  (`data/backup/*/meta.txt`).

### Changed

- Старые типы bot-ui демонтированы: `BotCommand`, `BotResponse`,
  `SessionData`, `SendMessage`/`EditMessageDescription` и старые ассерты.
- Кнопки «Программа курса» и «Детали» ужаты в одну строку.

### Fixed

- Старые кнопки «умирали» после рестарта бота («Экран устарел») — теперь
  нажимаются и продолжают диалог с того же вопроса.
- Экран завершения потока вместо повторного рендера последнего шага.

### Migration

- Миграция данных **не требуется**: файлы `data/bot/*.json` создаются
  лениво при первом апдейте.
