# План реализации — Трек C2: wish реализация + удаление CANDIDATE

## Фаза 1: Событие student.enrolled в stream

- [x] Task: Написать падающие тесты на `StudentAr.enroll` (добавляет событие) и публикацию в `enroll-student-uc` — 7ad0337e
- [x] Task: Добавить `StudentEnrolledEvent`, `addEvent` в `StudentAr.enroll`, `publishEvents` в UC (и удалить шаг «снятие CANDIDATE») — 7ad0337e
- [x] Task: Уведомление студенту при зачислении (tgFacade, сбой не откатывает) + тесты — 5976bf7
- [x] Task: Conductor - Ручная верификация 'Событие student.enrolled' — план перенесён в release.md (§2) по директиве пользователя «не останавливаясь»

## Фаза 2: ER fulfill-wish

- [x] Task: Написать падающие тесты на `filterCoursesContainingModule` (фасад курсов) и `fulfill-wish` ER (батч-принадлежность, переход expressed|confirmed→fulfilled, идемпотентность) — beb59c3
- [x] Task: Реализовать `WishAr.fulfill()` + `FulfillWishEr` + `filterCoursesContainingModule` (CourseFacade + InProc) + регистрация в `WishApiModule.reactions` — beb59c3
- [x] Task: Проверка `published` курса в `create-course-wish-uc` (draft/archived → COURSE_NOT_FOUND) + тесты — beb59c3
- [x] Task: Conductor - Ручная верификация 'fulfill-wish' — план перенесён в release.md (§3)

## Фаза 3: Удаление роли CANDIDATE

- [x] Task: Убрать `CANDIDATE` из enum (user + app), policy, `remove-role-to-user-uc` — 840adb7
- [x] Task: Обновить тесты и seed-fixtures (grep CANDIDATE → пусто) — 840adb7
- [x] Task: Вычистить `CANDIDATE` из JSON-данных (`data/`, прод `dbDir`) + проверка загрузки старых записей — 840adb7 (data/ вне git; прод-миграция — release.md §1)
- [x] Task: Conductor - Ручная верификация 'Удаление роли CANDIDATE' — план перенесён в release.md (§4)
