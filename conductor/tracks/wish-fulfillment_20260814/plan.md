# План реализации — Трек C2: wish реализация + удаление CANDIDATE

## Фаза 1: Событие student.enrolled в stream

- [x] Task: Написать падающие тесты на `StudentAr.enroll` (добавляет событие) и публикацию в `enroll-student-uc` — 7ad0337e
- [x] Task: Добавить `StudentEnrolledEvent`, `addEvent` в `StudentAr.enroll`, `publishEvents` в UC (и удалить шаг «снятие CANDIDATE») — 7ad0337e
- [~] Task: Уведомление студенту при зачислении (tgFacade, сбой не откатывает) + тесты
- [ ] Task: Conductor - Ручная верификация 'Событие student.enrolled'

## Фаза 2: ER fulfill-wish

- [ ] Task: Написать падающие тесты на `filterCoursesContainingModule` (фасад курсов) и `fulfill-wish` ER (батч-принадлежность, переход expressed|confirmed→fulfilled, идемпотентность)
- [ ] Task: Реализовать `WishAr.fulfill()` + `FulfillWishEr` + `filterCoursesContainingModule` (CourseFacade + InProc) + регистрация в `WishApiModule.reactions`
- [ ] Task: Проверка `published` курса в `create-course-wish-uc` (draft/archived → COURSE_NOT_FOUND) + тесты
- [ ] Task: Conductor - Ручная верификация 'fulfill-wish'

## Фаза 3: Удаление роли CANDIDATE

- [ ] Task: Убрать `CANDIDATE` из enum (user + app), policy, `remove-role-to-user-uc`
- [ ] Task: Обновить тесты и seed-fixtures (grep CANDIDATE → пусто)
- [ ] Task: Вычистить `CANDIDATE` из JSON-данных (`data/`, прод `dbDir`) + проверка загрузки старых записей
- [ ] Task: Conductor - Ручная верификация 'Удаление роли CANDIDATE'
