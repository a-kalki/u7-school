# План реализации — Трек: Персистентность сессий (bot-ui-session-persist_20260905)

> Материнский документ: [bot-ui-session-architecture.md](../../roadmap/bot-ui-session-architecture.md)

## Фаза 1: Порт BotSessionRepo [checkpoint: 70cc2a1]

- [x] Task: Написать падающие тесты: транспорт работает in-memory без repo (нынешнее поведение как дефолт)
- [x] Task: Объявить порт `BotSessionRepo` в `packages/core/src/ui/bot` (loadAll / save / remove; без деталей хранилища), транспорт принимает repo через конструктор (опционально) `7628253`
- [ ] Conductor - User Manual Verification 'Порт' (Protocol in workflow.md)

## Фаза 2: JsonBotSessionRepo [checkpoint: c3d0b22]

- [x] Task: Написать падающие тесты `JsonBotSessionRepo` (`apps/u7-bot/src/infra`): round-trip `BotSession` (dialog + screen), round-trip shortId-маппинга, Valibot-валидация при чтении, fail-fast на битом файле (`JsonFileRepoError`, без молчаливых пересозданий)
- [x] Task: Реализовать на `JsonFileRepo`/`BaseJsonDb`: коллекция сессий (ключ — chatId), коллекция shortId-записей (`hexKey → UUID` + суффиксы) `0c2bfe9`
- [ ] Conductor - User Manual Verification 'JsonBotSessionRepo' (Protocol in workflow.md)

## Фаза 3: Интеграция транспорта [checkpoint: f5d5410]

- [x] Task: Написать падающие тесты: сохранение сессии синхронно после каждого обработанного апдейта (await, per-chat очередь сериализует), `notify`/`info` не пишут; загрузка при старте до polling/webhook; shortId `Map` ↔ repo
- [x] Task: Реализовать интеграцию в `bot-transport.ts`; ошибка записи → warn-лог, работа в памяти продолжается `b67139e`
- [ ] Conductor - User Manual Verification 'Интеграция' (Protocol in workflow.md)

## Фаза 4: Сценарий рестарта и финал трека 6 [checkpoint: 8629a99]

- [x] Task: Интеграционный тест сценария: пользователь посреди fill → рестарт → кнопка старого экрана → штамп валиден, shortId разворачивается, анкета продолжается (`path`, `seq`, `input.context`, `messageId` восстановлены) `449b570`
- [x] Task: Обновить `bot-ui-session-architecture.md`: трек 6 в таблице §9 (без «опциональный»), §10.4 и §12.3 закрыты решением (`BotSessionRepo` на JsonFileRepo, shortIds в треке) `bb44171`
- [x] Task: `bun run check` весь репозиторий зелёный; создать `summary.md`
- [x] Conductor - User Manual Verification 'Финал' (Protocol in workflow.md) — принято владельцем 2026-09-15 (ручная проверка: сценарий рестарта, файлы хранилища, dev-фикстуры)
