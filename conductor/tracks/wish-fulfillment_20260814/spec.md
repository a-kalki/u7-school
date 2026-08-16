# Спецификация — Трек C2: wish реализация желания + удаление роли CANDIDATE

## Обзор

Две связанные задачи:

1. **Реализация желания:** при зачислении пользователя в поток его `Wish` помечается `fulfilled`.
2. **Удаление роли `CANDIDATE`:** роль полностью убирается из системы — информация о «желании учиться» теперь живёт в модуле `wish` (трек C1).

Зависит от: **A** (EventReaction), **C1** (wish с `Wish` и статусами), **B** (события/ownerInfo — для единообразия событий).

## Текущее состояние (базовая линия)

Роль `CANDIDATE` сейчас используется в:

- `packages/user/src/domain/user/roles.ts` — `Role` enum + `RoleSchema` (значение `CANDIDATE`).
- `packages/app/src/domain/user.ts` — **дубликат** `Role` enum + `RoleSchema` + `UserSchema` (значение `CANDIDATE`). ⚠️ два места!
- `packages/user/src/domain/user/policy.ts` — `canAddRole`/`canRemoveRole` разрешают обычному пользователю `STUDENT`/`CANDIDATE` себе.
- `packages/user/src/api/user/remove-role-to-user-uc.ts` — комментарий/логика «только STUDENT или CANDIDATE у себя».
- `packages/stream/src/api/student/enroll-student-uc.ts` — шаг 6 «Снятие роли CANDIDATE» (`userFacade.removeRoleFromUser(..., Role.CANDIDATE, ...)`).
- `packages/stream/src/domain/stream/policy.ts` — `canEnroll(actor) = !UserPolicy.isStudent(actor)` (CANDIDATE напрямую НЕ проверяется; проверяется «не студент»).
- Тесты/фикстуры: `user/roles.test.ts`, `user/a-root.test.ts`, `user/policy.test.ts`, `stream/policy.test.ts`, `stream/enroll-student-uc.test.ts`, `apps/u7-bot/src/controllers/app/stories/community.story.test.ts`, `apps/u7-bot/scripts/seed-fixtures.ts`.

Текущее зачисление НЕ публикует событий: `StudentAr.enroll` не накапливает `addEvent`, `enroll-student-uc` не вызывает `publishEvents`.

## Зафиксированные решения

1. **Зачисление → событие `student.enrolled`** (event-driven, как везде): `StudentAr.enroll` добавляет событие, `enroll-student-uc` публикует его после сохранения.
2. **`fulfill-wish` — ER** в модуле wish, подписан на `student.enrolled`.
3. **Шаг 6 в `enroll-student-uc` (снятие CANDIDATE) удаляется** — его заменяет публикация события.
4. **`Role.CANDIDATE` удаляется полностью** из обоих enum (`user` и `app`), policy, UC и всех тестов/фикстур.

## FR1 — Событие `student.enrolled` в stream

- Создать `packages/stream/src/domain/student/events.ts` (или рядом с `student`) с событием:
  ```ts
  export interface StudentEnrolledEvent extends DomainEvent {
    eventName: 'student.enrolled';
    aggregateName: 'Student';
    payload: {
      studentId: string;   // uuid записи
      userId: string;      // uuid пользователя
      streamId: string;    // uuid потока
      moduleId: string;    // uuid модуля потока (для резолва курса)
    };
  }
  ```
- `StudentAr.enroll(...)` — после создания добавлять событие через `addEvent` (поле `moduleId` взять из `StreamAr`/`streamEntity.moduleId`).
- `enroll-student-uc` — после `studentRepo.save(...)` вызвать `this.publishEvents(studentAr)`; **удалить шаг 6** (снятие CANDIDATE).

## FR2 — ER `fulfill-wish` в wish

Файл `packages/wish/src/api/er/fulfill-wish-er.ts` (трек A):

```ts
interface FulfillWishErMeta extends ErMeta<StudentEnrolledEvent> {
  erName: 'fulfill-wish';
}
```

`handle(event)`:
1. `const { userId, moduleId } = event.payload;`
2. `const course = await courseFacade.getCourseByModuleId(moduleId);` (если курса нет — пропустить).
3. Найти `Wish(userId, course.uuid)` со статусом `expressed`; если нет — пропустить (идемпотентность).
4. `wishAr.fulfill()` → сохранить (`status = 'fulfilled'`).

## FR3 — Метод `WishAr.fulfill()` (дополнение к C1)

- Добавить в `WishAr` (из C1) метод `fulfill()`: переход `expressed` → `fulfilled`.
- Инвариант: `fulfill()` допустим только из `expressed`.

## FR4 — Удаление роли `CANDIDATE`

Удалить `CANDIDATE` везде (порядок — чтобы не ломать сборку):

1. `packages/user/src/domain/user/roles.ts` — убрать `CANDIDATE` из enum и `RoleSchema`; обновить docstring.
2. `packages/app/src/domain/user.ts` — то же (дубликат enum + `RoleSchema`).
3. `packages/user/src/domain/user/policy.ts` — `canAddRole`/`canRemoveRole`: убрать упоминания `CANDIDATE` (обычный пользователь теперь может добавлять/снимать себе только `STUDENT`).
4. `packages/user/src/api/user/remove-role-to-user-uc.ts` — обновить комментарий/логику (только `STUDENT`).
5. Обновить тесты и фикстуры, ссылающиеся на `Role.CANDIDATE`:
   - `packages/user/.../roles.test.ts`, `a-root.test.ts`, `policy.test.ts`;
   - `packages/stream/.../policy.test.ts` (тест «canEnroll для CANDIDATE» → заменить на `GUEST`/`SUBSCRIBER`);
   - `packages/stream/.../enroll-student-uc.test.ts` (убрать проверки «снятие CANDIDATE»);
   - `apps/u7-bot/src/controllers/app/stories/community.story.test.ts`;
   - `apps/u7-bot/scripts/seed-fixtures.ts` (убрать `Role.CANDIDATE` из списка ролей dev-пользователя и текста).
6. Убедиться: `grep -rn "CANDIDATE" packages/ apps/` не находит ссылок (кроме, возможно, исторических комментариев — их тоже убрать).

## Критерии приёмки

- [ ] Зачисление публикует `student.enrolled` (payload с `moduleId`).
- [ ] `fulfill-wish` помечает `Wish(expressed)` как `fulfilled`; повторное событие идемпотентно.
- [ ] Шаг «снятие CANDIDATE» удалён из `enroll-student-uc`.
- [ ] `Role.CANDIDATE` полностью удалён (enum user+app, policy, UC, тесты, seed); `grep CANDIDATE` пуст.
- [ ] `bun run check:p wish`, `check:p stream`, `check:p user`, `check:p app`, `check:a u7-bot` проходят.

## За рамками

- UI (трек D).
- Другие статусы/типы желаний (бэклог в `course/ui-spec.md`).

## Контекст и связанные документы

- [arch-boundary-design](../../.pi/skills/arch-boundary-design/SKILL.md) — где размещать логику.
- [Трек A](../event-reaction_20260814/spec.md) — EventReaction/ErMeta.
- [Трек C1](../wish-module_20260814/spec.md) — Wish агрегат и статусы.
- [course/ui-spec.md](../../apps/u7-bot/src/controllers/courses/ui-spec.md) — доменные замечания (статусы Wish).
- [enroll-student-uc.ts](../../packages/stream/src/api/student/enroll-student-uc.ts) — точка зачисления.
- [Рабочий процесс](../../workflow.md) — жизненный цикл задач.
