# Итоги трека: Тестовые миры (test-worlds_20260923)

## 1. Обзор проделанной работы

Трек полностью реализован. В проекте произведён полный переход от хрупких ручных JSON-шаблонов (`tests/fixtures/templates/`) к декларативным **тестовым мирам** (`world-kit`).

Все 2692 теста проекта успешно переведены на генерацию фикстур из тестовых миров и проходят зелёными без единого сбоя. Каталог ручных JSON-шаблонов `apps/u7-bot/tests/fixtures/templates/` физически удалён.

---

## 2. Реализованные компоненты

### 2.1. Каркас world-kit (`apps/u7-bot/tests/worlds/`)
- **`types.ts`**: Типы `WorldState` (нейтральные коллекции агрегатов домена) и интерфейсы декларативного описания мира (`PersonDef`, `CourseDef`, `StreamDef`, `StudentDef`, `CampaignDef`, `ReviewDef`, `WorldDefinition`, `WorldManifest`).
- **`uuid.ts`**: Детерминированная генерация UUID из ключей (`deterministicUuid`) на базе SHA-256. Одинаковые ключи гарантируют одинаковые UUID между сборками.
- **`relative-time.ts`**: Парсер относительного времени относительно опорной шкалы `T` (`resolveRelativeTime`) с поддержкой `T`, `T-2d`, `T-2д`, `T+5d`, `T-2h`, `T-30m` и канонического формата `isoMinute` (`YYYY-MM-DDTHH:mm`), валидируемого Valibot `UserSchema` и `StreamSchema`.
- **`builder.ts`**: Конструкторы агрегатов (`person`, `course`, `stream`, `student`, `campaign`, `review`) и функция `buildWorldState`, собирающая согласованный граф сущностей с контролем инвариантов.
- **`invariants.ts`**: Комплексная проверка инвариантов мира (`checkWorldInvariants`, `assertWorldInvariants`):
  1. «Судьба кампании == исход студента»: `completed_passed` → `advanced`, `completed_failed` → `not_advanced`, `dropped` → `abandoned`.
  2. «Роль пользователя == статус в потоке»: студент в активном потоке обязан иметь роль `STUDENT`; ментор потока обязан иметь роль `MENTOR`; автор курса — `AUTHOR`.
  3. «Хронология»: `регистрация пользователя <= зачисление в поток <= старт потока / исход студента`.
  4. «Окно кампании»: `createdAt < expiresAt`, окно открыто не раньше даты зачисления/исхода.
- **`materializer.ts`**: Кеш материализации в `.cache/worlds/<name>-<sourceHash>` и функция `getWorldFixtures` для copy-on-write раздачи изолированных копий временных директорий тестам с поддержкой переменной `KEEP_FIXTURES=1`.
- **`registry.ts`**: Реестр зарегистрированных миров (`registerWorld`, `getWorld`, `listWorlds`).
- **`manifest-and-seed.ts`**: Генерация манифеста `world.json` (`name`, `hash`, `generatedAt`), сидирование `seedWorldFixtures` в `data/fixtures/` и функция `logActiveWorldIfPresent`.
- **`dev-persona-loader.ts`**: Автоматическое извлечение dev-персон (`extractDevPersonasFromWorld`) для переключателя `/persona`.

### 2.2. Канонические миры
- **`minimal`** (`apps/u7-bot/tests/worlds/minimal.ts`): Минимальный мир для дымовых прогонов (только dev-персона с ролями ADMIN и MENTOR, пустые списки модульных данных).
- **`core-education`** (`apps/u7-bot/tests/worlds/core-education.ts`): Полноценный продуктовый образовательный мир:
  - 3 курса («Основы программирования», «UX/UI Дизайн с нуля», «Продвинутый JavaScript») + тестовые и пагинационные курсы;
  - 3 потока с разным жизненным циклом (завершённый, активный, в наборе);
  - Качественный контент проектов, уроков и шагов без плейсхолдеров, с полными URL (ФР-9);
  - 16 проектов каталога (`f5f5...`) и 24 проекта программы S03 (`f8f8...`) для пагинации;
  - Согласованные кампании peer-review и 4 отзыва с реальными текстами.

### 2.3. Инструменты и CLI
- **`world:check`** (`apps/u7-bot/scripts/world-check.ts`): Валидация миров на соблюдение инвариантов. CLI завершается с ненулевым кодом при ошибках.
- **`world:list`** (`apps/u7-bot/scripts/world-list.ts`): Вывод списка зарегистрированных миров в консоль.
- Интеграция с ботом: при старте бота в dev-режиме (`apps/u7-bot/src/main.ts`) логируется имя и хеш активного мира из `world.json`.
- `seed-fixtures.ts`: поддерживает выбор мира через переменную окружения `WORLD=<имя>` (по умолчанию `core-education`).

---

## 3. Результаты гейта и проверок

- **Тесты:** 2692 pass / 0 fail (274 тестовых файла).
- **Линтер:** `biome check` — 0 ошибок, 0 предупреждений (952 файла проверено).
- **TypeScript:** `tsc --noEmit` — 0 ошибок типизации.
- **Инварианты:** `bun run world:check` подтверждает валидность миров `minimal` и `core-education`.
