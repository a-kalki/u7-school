# План реализации: stream_domain_fixes

## Фаза 1: StreamDs.completeStep — определение уровней lesson/project

- [x] Task: Написать тесты для StreamDs.completeStep с определением уровней `dc893e7`
    - [x] Тест: уровень `step` — следующий шаг в том же уроке
    - [x] Тест: уровень `lesson` — переход на следующий урок (возвращает completedLessonId)
    - [x] Тест: уровень `project` — переход на следующий проект (возвращает completedProjectId)
    - [x] Тест: уровень `stream` — последний шаг, студент completed

- [x] Task: Реализовать определение уровней в StreamDs.completeStep `dc893e7`
    - [x] Добавить методы `findLessonByStepId` и `findProjectByLessonId` в StreamAr
    - [x] Обновить `StreamDs.completeStep` для возврата корректного CompletionResult

- [ ] Task: Conductor - User Manual Verification 'Фаза 1' (Protocol in workflow.md)

## Фаза 2: ActivateStreamUc — выдача первого шага студентам

- [ ] Task: Написать тесты для активации студентов в ActivateStreamUc
    - [ ] Тест: успешная активация — поток active, студентам выдан первый шаг
    - [ ] Тест: пропуск студентов, у которых уже есть выданные шаги
    - [ ] Тест: поток без зачисленных студентов — активируется без ошибок
    - [ ] Тест: ошибка если поток не в статусе enrollment

- [ ] Task: Реализовать активацию студентов в ActivateStreamUc
    - [ ] Загрузить студентов потока через StudentRepo
    - [ ] Для каждого студента без шагов — выдать первый шаг
    - [ ] Сохранить всех студентов

- [ ] Task: Conductor - User Manual Verification 'Фаза 2' (Protocol in workflow.md)

## Фаза 3: Новые UseCases и проверки авторизации

- [ ] Task: Написать тесты для GetStreamUc
    - [ ] Тест: возвращает поток по streamId
    - [ ] Тест: ошибка если поток не найден

- [ ] Task: Реализовать GetStreamUc
    - [ ] Создать `api/stream/get-stream-uc.ts` с командой и схемой
    - [ ] Зарегистрировать в StreamApiModule

- [ ] Task: Написать тесты для GetStudentByUserUc
    - [ ] Тест: возвращает активную запись студента
    - [ ] Тест: ошибка если активная запись не найдена

- [ ] Task: Реализовать GetStudentByUserUc
    - [ ] Создать `api/student/get-student-by-user-uc.ts` с командой и схемой
    - [ ] Использовать `StudentRepo.getByUser` + фильтр по `status === 'active'`
    - [ ] Зарегистрировать в StreamApiModule

- [ ] Task: Написать тесты для ListStreamStudentsUc
    - [ ] Тест: возвращает список студентов потока
    - [ ] Тест: пустой список если студентов нет
    - [ ] Тест: доступ запрещён для не-ментора и не-админа

- [ ] Task: Реализовать ListStreamStudentsUc
    - [ ] Создать `api/stream/list-stream-students-uc.ts` с командой и схемой
    - [ ] Проверка прав: ментор потока или админ
    - [ ] Зарегистрировать в StreamApiModule

- [ ] Task: Написать тесты для проверок авторизации в существующих UC
    - [ ] Тест: ActivateStreamUc — запрет для не-ментора
    - [ ] Тест: ArchiveStreamUc — запрет для не-ментора
    - [ ] Тест: CompleteStreamUc — запрет для не-ментора
    - [ ] Тест: GetStudentProgressUc — запрет для чужого студента

- [ ] Task: Добавить проверки авторизации в ActivateStreamUc, ArchiveStreamUc, CompleteStreamUc, GetStudentProgressUc
    - [ ] ActivateStreamUc: StreamPolicy.canEdit(actor, stream)
    - [ ] ArchiveStreamUc: StreamPolicy.canEdit(actor, stream)
    - [ ] CompleteStreamUc: StreamPolicy.canEdit(actor, stream)
    - [ ] GetStudentProgressUc: StudentPolicy.canViewProgress(actor, student) + ментор потока

- [ ] Task: Conductor - User Manual Verification 'Фаза 3' (Protocol in workflow.md)

## Фаза 4: EnrollStudentUc — проверка существующей активной записи

- [ ] Task: Написать тесты для проверки активной записи в EnrollStudentUc
    - [ ] Тест: ошибка если у пользователя уже есть активный поток
    - [ ] Тест: успешная запись если предыдущие записи archived/completed

- [ ] Task: Реализовать проверку активной записи в EnrollStudentUc
    - [ ] Перед созданием StudentAr проверить `StudentRepo.getByUser`
    - [ ] Если есть запись со статусом `active` — ошибка

- [ ] Task: Conductor - User Manual Verification 'Фаза 4' (Protocol in workflow.md)
