# Спецификация трека: Роль AUTHOR (автор программы)

> **Контекст эволюции:** `conductor/architecture-evolution.md` (§2.9). Прочитать перед началом.
> **Зависимости:** нет. Блокирует Трек 0 (`course_aggregate`) — gates создания курса.

## Обзор
Разделить две ответственности, сейчас совмещённые в роли MENTOR:
- **AUTHOR** — создаёт программу обучения: модули, курсы, уроки, шаги, проекты.
- **MENTOR** — преподаёт: создаёт/ведёт потоки (Stream), активирует/завершает, мониторит студентов.

Принцип: **создание — прерогатива роли; редактирование — ADMIN или автор (по authorId).** ADMIN не создаёт, только редактирует.

**Роли:** AUTHOR (новая), MENTOR, ADMIN.

## Функциональные требования

### F1. Новая роль AUTHOR
- `Role.AUTHOR` в `packages/user/src/domain/user/roles.ts` + `RoleSchema`.
- Роль выдаёт ADMIN (через существующий UC `addRoleToUser` — admin может добавить любую роль). Нового UC не нужно.
- Пользователь может иметь несколько ролей (Нур = ADMIN+AUTHOR+MENTOR).

### F2. Gates создания контента → AUTHOR
- `ModulePolicy.canCreate`: `MENTOR` → `AUTHOR`.
- `CoursePolicy.canCreate` (новый, Трек 0): `AUTHOR` (не ADMIN).
- `create-module` UC → AUTHOR.
- `create-course` UC (Трек 0) → AUTHOR.
- Создание уроков/шагов/проектов внутри модуля (`add-project`, `create-lesson`, `create-step`) — уже gated по `isAuthor` (authorId), без роли. Без изменений: автор модуля (с AUTHOR-ролью для создания модуля) редактирует по authorId.

### F3. Gates редактирования → ADMIN или автор (без изменений)
- `ModulePolicy.canEdit` (`isAdminOrAuthor`), `canAddProject`, `canRead` — без изменений.
- `CoursePolicy.canEdit` (Трек 0) → ADMIN или author.
- `enrich-module`, `publish-module`, `add-project` — уже `canEdit` (ADMIN|author). Без изменений.
- ADMIN **может редактировать**, но **не может создавать** модуль/курс.

### F4. Потоки (Stream) — без изменений
- `StreamPolicy.canCreate` → `MENTOR` (создаёт преподаватель, не автор, не ADMIN).
- `StreamPolicy.canEdit` → ADMIN или mentor потока.
- AUTHOR не создаёт и не ведёт потоки (если хочет преподавать свой модуль — получает MENTOR).

### F5. Миграция ролей
- Пользователи, являющиеся авторами существующих модулей (`module.authorId`), получают AUTHOR.
- На проде: Нур (автор «Синтаксис» и «Алгоритмики») → `+AUTHOR`.
- Решается на месте.

### F6. Документация
- `product.md` — добавить роль AUTHOR, уточнить MENTOR (преподаёт, не авторит).
- `architecture-evolution.md` — §2.9.

## Критерии приёмки
- [ ] `Role.AUTHOR` добавлена, валидируется.
- [ ] `create-module` доступен только AUTHOR; ADMIN получает access denied.
- [ ] `canEdit` модуля/курса — ADMIN или author (ADMIN редактирует).
- [ ] Потоки создаёт MENTOR (без изменений).
- [ ] Миграция: существующие авторы получили AUTHOR.
- [ ] Покрытие >80%, TDD.

## За рамками
- Статистика по курсам для автора (отдельно, не в этом треке и не в бэклоге — отмечено как будущая потребность).
- Просмотр автором отдельных студентов — нет (это ментор потока).
- UI «Инструменты автора» — в Треке 5 (роль-gated секция рядом с «Инструментами ментора»).
