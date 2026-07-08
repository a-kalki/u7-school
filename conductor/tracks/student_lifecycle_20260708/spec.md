# Спецификация трека: Жизненный цикл студента

> **Контекст эволюции:** `conductor/architecture-evolution.md` (§2.3, §2.4, §2.5, §2.6, §3, §6). Прочитать перед началом.

## Обзор
Ввести финальную модель статусов студента (`enrolled | active | abandoned | advanced | not_advanced`), формализовать выдачу/снятие роли STUDENT, переработать завершение потока (ментор явно выбирает исход для каждого студента), добавить `User.nick`, порт `TgFacade` и confirm-хелпер. Фундамент для треков 3, 4, 6.

**Роли:** STUDENT, MENTOR, ADMIN.

## Функциональные требования

### F1. Финальные статусы студента
- Enum: `enrolled | active | abandoned | advanced | not_advanced`.
- Поля, зависящие от статуса:
  - `abandonDetails?: { who: 'self' | 'mentor'; cause: 'voluntary' | 'inactivity' | 'by_mentor' }` — только при `abandoned`.
  - `completionDetails?: { nextPreference: 'wants_next' | 'wants_repeat' | 'undecided' }` — только при `advanced` или `not_advanced`. По умолчанию `'undecided'`.
- `StudentSchema` обновить.
- `StudentAr` методы:
  - `activate()` — enrolled → active.
  - `drop()` — active → abandoned (who=self, cause=voluntary).
  - `markAbandoned(cause)` — active → abandoned (who=mentor, cause=inactivity|by_mentor).
  - `advance()` — active → advanced, completionDetails.nextPreference = 'undecided'.
  - `markNotAdvanced()` — active → not_advanced, completionDetails.nextPreference = 'undecided'.
  - `setNextPreference(pref)` — обновляет `completionDetails.nextPreference` (только при advanced/not_advanced).
- Статус-переходы валидируются: недопустимые → throwBadRequest.
  - Допустимые переходы: enrolled→active; active→abandoned|advanced|not_advanced.
  - `setNextPreference` — только если статус advanced или not_advanced.

### F2. Роль STUDENT
- `STUDENT` выдаётся при `enroll-student` (зачисление в поток).
- `STUDENT` снимается при:
  - Переходе в `abandoned` (drop / markAbandoned).
  - Завершении потока (active → advanced / not_advanced / abandoned).
- При `activate-stream` роль не меняется.
- При зачислении в следующий поток → STUDENT выдаётся снова.

### F3. UC
- `complete-student` (ментор потока/admin): active → abandoned|advanced|not_advanced (выбор ментора) + −STUDENT.
- `drop-student` (self): active → abandoned(voluntary) + −STUDENT.
- `mark-abandoned` (ментор): active → abandoned(inactivity|by_mentor) + −STUDENT. Заменяет прежний `expel-student`.
- `enroll-student`: зачисление → enrolled + +STUDENT.
- `activate-stream`: enrolled→active для всех студентов потока.
- `CompleteStreamUc` — полная переработка:
  - Ментор вызывает «Завершить поток».
  - Процесс подтверждения действия.
  - Бот выводит список всех active-студентов с выбором исхода для каждого: abandoned / advanced / not_advanced.
  - После подтверждения ментором:
    - Статусы обновляются, STUDENT снимается.
    - Для advanced: tgFacade.sendMessage — «Ты завершил модуль. Хочешь записаться на следующий?»
    - Для not_advanced: tgFacade.sendMessage — «Ты завершил модуль, но не набрал проходной балл. Хочешь перезаписаться на этот же модуль?»
    - Для abandoned: сообщение не отправляется.
  - Ответы студентов обрабатываются через story → обновляется `completionDetails.nextPreference`.
- `set-next-preference` (self): обновляет `completionDetails.nextPreference` у advanced/not_advanced студента.

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
- Применить в MonitorStory (complete-student, mark-abandoned) и CompleteStreamUc.

### F7. Миграция статусов
- Прод `streams/students.json`: `dropped`→`abandoned`+`abandonDetails:{who:'self', cause:'voluntary'}`, `expelled`→`abandoned`+`abandonDetails:{who:'mentor', cause:'by_mentor'}`.
- Скрипт миграции. Решается на месте (процесс живой).

## Критерии приёмки
- [ ] Статус-машина студента (5 статусов) реализована, переходы валидируются.
- [ ] Роль STUDENT корректно снимается/выдаётся: +при enrolled, −при abandoned/advanced/not_advanced.
- [ ] `CompleteStreamUc`: ментор выбирает исход для каждого студента, рассылает сообщения через TgFacade.
- [ ] `User.nick` добавлено, валидируется уникальность.
- [ ] `TgFacade` порт в core, impl в app, доступен в resolver.
- [ ] Confirm-хелпер применяется, дублирование confirm-логики устранено.
- [ ] Миграция прод-статусов выполнена (на месте).
- [ ] Покрытие >80%, TDD. Старые тесты `tests/bot` обновлены (`expelled`→`abandoned`).

## За рамками
- UI кнопок complete-student/drop (сториз) — в треках 4/6, но UC готовы здесь.
- Gating: чтение `completionDetails.nextPreference` для продвижения (трек 3).
- Broadcast-рассылка (бэклог).
