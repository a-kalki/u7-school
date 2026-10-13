# Каталог правил

**Назначение:** проверяемые правила новой архитектуры. Агенты и ревьюер ссылаются на ID. Правило меняется только через [decisions.md](./decisions.md).

Способ проверки: **lint** — biome (`noRestrictedImports`, GritQL-плагины); **type** — компилятор; **test** — контрактный/рантайм-тест; **review** — агент-ревьюер. Машинные проверки появляются в треке core; до этого всё помечается `review`.

---

## ARC — пакеты и границы

| ID | Правило | Проверка |
|---|---|---|
| ARC-01 | `core` не импортирует domain, app, модули | lint |
| ARC-02 | `domain` импортирует только `core` (и valibot) | lint |
| ARC-03 | В `domain` нет IO: fs, сеть, eventBus, репозитории | lint |
| ARC-04 | Контексты domain импортируют друг друга только через `<context>/index.ts` и только из `dependsOn` | lint + test |
| ARC-05 | Модульный пакет не импортирует другие модульные пакеты | lint |
| ARC-06 | `app` импортирует только core и domain | lint |
| ARC-07 | apps вызывают логику только через `appApi` и `UiService` | lint |

## DOM — домен

| ID | Правило | Проверка |
|---|---|---|
| DOM-01 | Данные entity (`@u7-scl/domain/state`) используются только в Ar, infra (repo) и UI | lint |
| DOM-02 | Ar не создаёт и не возвращает другой Ar | review |
| DOM-03 | Бизнес-методы Ar возвращают `Result`; `throw` — только инвариант/баг | type + review |
| DOM-04 | Ar отдаёт идентификаторы и методы-вопросы, не геттер на каждое поле | review |
| DOM-05 | Policy собрана из именованных `rule` с `label` и `denyMessage`, возвращает решение, а не boolean | type |
| DOM-06 | ApiService — только для ≥2 агрегатов или логики ≥2 UC; возвращает `Result` | review |
| DOM-07 | UiService только читает, работает с view-данными; api-слой его не импортирует | lint + review |
| DOM-08 | `Loader` — только для условной или дорогой загрузки | review |
| DOM-09 | Домен синхронный; `async` — только вызовы `Loader` | review |
| DOM-10 | uuid, даты и другие базовые поля — только через `F.*`/`shared` | lint |
| DOM-11 | Даты — `Timestamp` (number, мс); `isoDateTime` в новых схемах запрещён | lint |

## MAN — манифесты

| ID | Правило | Проверка |
|---|---|---|
| MAN-01 | Ar, UC, ER, Job, Event, Error имеют манифест с непустыми `label` и `description` | type + test |
| MAN-02 | Каждое поле схем input/output/entity имеет `description` | test |
| MAN-03 | Схемы input/output конвертируются в JSON Schema | test |
| MAN-04 | UC/ER/Job публикуют только события из `emits` | test |
| MAN-05 | ER трогает только `touches` и вызывает только `calls` | test |
| MAN-06 | Граф связен: нет висячих подписчиков, неопубликованных событий, UC вне модуля | test |
| MAN-07 | Свойства манифеста не дублируются в классах реализации | type + review |
| MAN-08 | Обратные связи (кто управляет агрегатом, кто слушает) не пишутся вручную | review |

## ERR — ошибки

| ID | Правило | Проверка |
|---|---|---|
| ERR-01 | Штатные отказы не бросаются (Ar, ApiService, UC) | review + lint |
| ERR-02 | UC возвращает только ошибки из своего `errors` + базовые | type |
| ERR-03 | Ошибки объявлены через `defineError` с `kind`; UC ссылается без ремаппинга | review |
| ERR-04 | Вызывающий код обрабатывает `Err` явно, с веткой по умолчанию | review |

## API — модульные пакеты

| ID | Правило | Проверка |
|---|---|---|
| API-01 | UC — только оркестрация: Ar → Policy → Ar/ApiService → save → publish | review |
| API-02 | Репозитории возвращают и принимают Ar | type |
| API-03 | Межмодульные вызовы — только через контракты фасадов; фасад отдаёт DTO/VO, не Ar | type + review |
| API-04 | UC/ER/Job наследуют `*FromManifest` | type |

## TST — тесты

| ID | Правило | Проверка |
|---|---|---|
| TST-01 | Каждая ветка `Ok`/`Err` бизнес-метода Ar покрыта тестом | review |
| TST-02 | Каждое правило Policy покрыто тестом на allowed и denied | review |
| TST-03 | Каждая собственная объявленная ошибка UC покрыта тестом | review |
| TST-04 | `bun run check` зелёный после каждого шага агента | test |
