# Итоговый отчёт трека: Роль AUTHOR (автор программы)

**Track ID:** `author_role_20260708`
**Цель:** Разделить две ответственности, совмещённые в роли MENTOR — AUTHOR (создаёт программу: модули, курсы, уроки, шаги, проекты) и MENTOR (преподаёт: создаёт/ведёт потоки, мониторит студентов). Принцип: создание — прерогатива роли; редактирование — ADMIN или автор (по authorId). ADMIN не создаёт, только редактирует.

## Выполненные задачи

### Фаза 1: Роль AUTHOR в домене user
- Добавлена `Role.AUTHOR` в enum и `RoleSchema` (packages/user/src/domain/user/roles.ts).
- Добавлен `UserPolicy.isAuthor(actor)` — проверка роли автора программы.
- Тесты: AUTHOR валиден, входит в список; isAuthor покрывает варианты.

### Фаза 2: Gates создания контента → AUTHOR
- `ModulePolicy.canCreate`: `isMentor` → `isAuthor`.
- `LessonPolicy.canCreate` и `StepPolicy.canCreate` приведены с ролевых проверок (`isMentor` / `ADMIN||MENTOR`) на `isAuthor` — исправлено расхождение со спецификацией (создание контента внутри модуля = прерогатива AUTHOR; согласовано с пользователем).
- `create-module`/`create-lesson`/`create-step` UC: gating через canCreate, обновлены комментарии.
- `add-project` UC без изменений (`canEdit` = ADMIN|author).
- Синхронизирован дубликат `Role` в packages/app/src/domain/user.ts (добавлен AUTHOR) — устранена TS-регрессия структурного несовпадения типов.
- Интеграционные тесты CourseApiModule переведены с MENTOR на AUTHOR.

### Фаза 3: Тесты редактирования (regression)
- Добавлены regression-тесты `canEdit`: AUTHOR-автор модуля может; AUTHOR без авторства не может (роль сама по себе не даёт canEdit).
- Подтверждено: enrich-module/publish-module/add-project gating (canEdit=ADMIN|author) не сломан.

### Фаза 4: Миграция и документация
- Миграция: AUTHOR выдана авторам модулей (Dev в data/fixtures, Ментор в tests/bot/fixtures, Нур на проде — на месте). Добавлен fixture-пользователь «Автор».
- `seed-fixtures.ts`: dev-аккаунту выдаётся AUTHOR.
- `architecture-evolution.md` §2.9: отмечена реализация, добавлены LessonPolicy/StepPolicy.
- `product.md`: уже актуален (без изменений).
- `stream/ui-spec.md`: без изменений (потоки F4; UI «Инструменты автора» — Трек 5).
- Bot regression-тест: AUTHOR без MENTOR не видит «Создать поток» (StreamPolicy.canCreate остался MENTOR).

## Изменённые файлы
- packages/user/src/domain/user/roles.ts, roles.test.ts
- packages/user/src/domain/user/policy.ts, policy.test.ts
- packages/course/src/domain/module/policy.ts, policy.test.ts
- packages/course/src/domain/lesson/policy.ts, policy.test.ts
- packages/course/src/domain/step/policy.ts, policy.test.ts
- packages/course/src/api/module/create-module-uc.ts, create-module-uc.test.ts
- packages/course/src/api/lesson/create-lesson-uc.ts, create-lesson-uc.test.ts
- packages/course/src/api/step/create-step-uc.ts, create-step-uc.test.ts
- packages/course/src/api/module.test.ts
- packages/app/src/domain/user.ts
- apps/u7-bot/scripts/seed-fixtures.ts
- data/fixtures/users/users.json
- tests/bot/fixtures/templates/users.json
- tests/bot/integration/stream/create-stream.integration.test.ts
- conductor/architecture-evolution.md
- data/users/users.json (прод, gitignored — миграция на месте)

## Архитектурные решения и обоснования
1. **AUTHOR как отдельная роль, не иерархия:** пользователь может иметь несколько ролей (Нур = ADMIN+AUTHOR+MENTOR). Создание контента = наличие роли AUTHOR; редактирование = ADMIN или author по authorId. Это разделяет «кто может создавать» (роль) и «кто может редактировать конкретный объект» (авторство).
2. **LessonPolicy/StepPolicy.canCreate → isAuthor:** спецификация неточно описала текущее состояние («уже isAuthor-based»). По подтверждению пользователя приведено в соответствие с принципом трека — иначе AUTHOR не смог бы создавать уроки/шаги в своём модуле.
3. **Дубликат Role в packages/app синхронизирован, не удалён:** устранение дубликата — отдельный техдолг (зафиксирован пользователем в коммите dae3d7c). Минимальное изменение — добавить AUTHOR, чтобы не ломать типы.

## Отклонения от первоначального плана
- LessonPolicy/StepPolicy.canCreate изменены (план говорил «без изменений») — по согласованию с пользователем, т.к. спецификация ошиблась о текущем состоянии кода.
- packages/app/src/domain/user.ts синхронизирован (не в плане) — необходимое исправление TS-регрессии.

## Известные ограничения / незавершённые задачи
- UI «Инструменты автора» (создание модулей через бот) — в Треке 5 (module_gating / student_navigation).
- Статистика по курсам для автора — будущая потребность (не в бэклоге).
- Предсуществующая ошибка biome в чужом учебном mentor-файле `02-variable-errors.js` (демонстрация `var`) — не из трека, не исправлялась.
- Незакоммиченная правка пользователя в `packages/course/src/domain/lesson/policy.ts` (extract method `isPublished`) — не тронута агентом.
