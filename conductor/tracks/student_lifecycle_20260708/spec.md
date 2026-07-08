# Спецификация трека: Жизненный цикл студента

> **Контекст эволюции:** `conductor/architecture-evolution.md` (§2.3, §2.4, §2.5, §2.6, §3, §6). Прочитать перед началом.

## Обзор
Перевести статусы студента на enriched-модель (`enrolled | active | abandoned | completed | wants_next | advanced | not_advanced`), формализовать снятие/выдачу роли STUDENT, доработать завершение потока, добавить `User.nick`, порт `TgFacade` и confirm-хелпер. Фундамент для треков 3, 4, 6.

**Роли:** STUDENT, MENTOR, ADMIN.

## Функциональные требования

### F1. Enriched статусы студента
- Enum: `enrolled | active | abandoned | completed | wants_next | advanced | not_advanced`.
- `abandonReason: 'voluntary' | 'inactivity' | 'by_mentor'` (опц., только при `abandoned`).
- `StudentSchema` обновить.
- `StudentAr` методы:
  - `activate()` (enrolled→active) — вызывается при activate-stream.
  - `drop()` (self → abandoned, reason=voluntary).
  - `markAbandoned()` (mentor → abandoned, reason=inactivity|by_mentor).
  - `complete()` (есть — completed).
  - `markWantsNext()` (completed→wants_next).
  - `advance()` (→ advanced).
  - `markNotAdvanced()` (→ not_advanced).
- Статус-переходы валидируются (недопустимые → throwBadRequest).

### F2. Роль STUDENT = активен в активном потоке
- `STUDENT` снимается при переходе в `completed*`/`abandoned`.
- `STUDENT` выдаётся при `enrolled` (запись) и снова при `advance` (запись на след. модуль).
- При `activate-stream`: всем `enrolled` → `active` + issue первого шага (если ещё не выдан).

### F3. UC
- `complete-student` (ментор потока/admin): active→completed + `-STUDENT`. Через confirm в UI.
- `drop-student` (self): active/enrolled→abandoned(voluntary) + `-STUDENT`.
- `mark-abandoned` (ментор): →abandoned(inactivity|by_mentor) + `-STUDENT`. Заменяет прежний `expel-student` (семантически = abandoned(by_mentor)).
- `enroll-student`: при зачислении → `enrolled` (не active сразу), `+STUDENT`.
- `activate-stream`: enrolled→active для всех студентов потока.
- `CompleteStreamUc` доработать: при завершении потока все `active`/`enrolled` → `completed`, снять `STUDENT`.

### F4. User.nick
- `UserSchema`: `nick?: string` (уникальное при заполнении — проверка в UC/репо).
- UC `set-nick` (self) либо расширить update-пользователя.
- Используется для прямых сообщений и отображения.

### F5. TgFacade (порт)
- Интерфейс `TgFacade` в `core` (домен/порт): `sendMessage(telegramId, text)`, `sendBatch(telegramIds[], text)`.
- Реализация в `app`/infra (Grammy). Wiring в app.
- Добавить `tgFacade: TgFacade` в `StreamApiModuleResolver` (и `CourseApiModuleResolver` при необходимости).
- В story НЕ передаётся.

### F6. Confirm-хелпер
- В `core/ui` (или `app/ui`): helper построения confirm-клавиатуры + базовый метод `U7BotUserStory.confirm(action, text, confirmCode, cancelCode)`.
- Формализовать convention `action`/`action-confirm`.
- Применить в S08 (complete-student, mark-abandoned) и существующих (expel→abandoned, complete-stream).

### F7. Миграция статусов
- Прод `streams/students.json`: `dropped`→`abandoned`+`abandonReason:'voluntary'`, `expelled`→`abandoned`+`abandonReason:'by_mentor'`.
- Скрипт миграции. Решается на месте (процесс живой).

## Критерии приёмки
- [ ] Статус-машина студента реализована, переходы валидируются.
- [ ] Роль STUDENT корректно снимается/выдаётся по статусам.
- [ ] `complete-stream` завершает active/enrolled студентов.
- [ ] `User.nick` добавлено, валидируется уникальность.
- [ ] `TgFacade` порт в core, impl в app, доступен в resolver.
- [ ] Confirm-хелпер применяется, дублирование confirm-логики устранено.
- [ ] Миграция прод-статусов выполнена (на месте).
- [ ] Покрытие >80%, TDD. Старые тесты `tests/bot` обновлены (`expelled`→`abandoned`).

## За рамками
- UI кнопок complete-student/drop (сториз) — в треках 4/6, но UC готовы здесь.
- Gating `wants_next`→`advanced` (трек 3).
- Broadcast-рассылка (бэклог).
