# План реализации: stream_domain_fixes

## Фаза 1: StreamDs.completeStep — определение уровней lesson/project [checkpoint: e6e66f9]

- [x] Task: Написать тесты для StreamDs.completeStep с определением уровней `dc893e7`
    - [x] Тест: уровень `step` — следующий шаг в том же уроке
    - [x] Тест: уровень `lesson` — переход на следующий урок (возвращает completedLessonId)
    - [x] Тест: уровень `project` — переход на следующий проект (возвращает completedProjectId)
    - [x] Тест: уровень `stream` — последний шаг, студент completed

- [x] Task: Реализовать определение уровней в StreamDs.completeStep `dc893e7`
    - [x] Добавить методы `findLessonByStepId` и `findProjectByLessonId` в StreamAr
    - [x] Обновить `StreamDs.completeStep` для возврата корректного CompletionResult

- [x] Task: Conductor - User Manual Verification 'Фаза 1' (Protocol in workflow.md) `e6e66f9`

## Фаза 2: ActivateStreamUc — выдача первого шага студентам [checkpoint: 5cac874]

- [x] Task: Написать тесты для активации студентов в ActivateStreamUc `8460425`
    - [x] Тест: успешная активация — поток active, студентам выдан первый шаг
    - [x] Тест: пропуск студентов, у которых уже есть выданные шаги
    - [x] Тест: поток без зачисленных студентов — активируется без ошибок
    - [x] Тест: ошибка если поток не в статусе enrollment

- [x] Task: Реализовать активацию студентов в ActivateStreamUc `8460425`
    - [x] Загрузить студентов потока через StudentRepo
    - [x] Для каждого студента без шагов — выдать первый шаг
    - [x] Сохранить всех студентов

- [x] Task: Conductor - User Manual Verification 'Фаза 2' (Protocol in workflow.md) `5cac874`

## Фаза 3: Новые UseCases и проверки авторизации

- [x] Task: Написать тесты для GetStreamUc `TBD`
    - [x] Тест: возвращает поток по streamId
    - [x] Тест: ошибка если поток не найден

- [x] Task: Реализовать GetStreamUc `TBD`
    - [x] Создать `api/stream/get-stream-uc.ts` с командой и схемой
    - [x] Зарегистрировать в StreamApiModule

- [x] Task: Написать тесты для GetStudentByUserUc `TBD`
    - [x] Тест: возвращает активную запись студента
    - [x] Тест: ошибка если активная запись не найдена

- [x] Task: Реализовать GetStudentByUserUc `TBD`
    - [x] Создать `api/student/get-student-by-user-uc.ts` с командой и схемой
    - [x] Использовать `StudentRepo.getByUser` + фильтр по `status === 'active'`
    - [x] Зарегистрировать в StreamApiModule

- [x] Task: Написать тесты для ListStreamStudentsUc `TBD`
    - [x] Тест: возвращает список студентов потока
    - [x] Тест: пустой список если студентов нет
    - [x] Тест: доступ запрещён для не-ментора и не-админа

- [x] Task: Реализовать ListStreamStudentsUc `TBD`
    - [x] Создать `api/stream/list-stream-students-uc.ts` с командой и схемой
    - [x] Проверка прав: ментор потока или админ
    - [x] Зарегистрировать в StreamApiModule

- [x] Task: Написать тесты для проверок авторизации в существующих UC `8f330a8`
    - [x] Тест: ActivateStreamUc — запрет для не-ментора
    - [x] Тест: ArchiveStreamUc — запрет для не-ментора
    - [x] Тест: CompleteStreamUc — запрет для не-ментора
    - [x] Тест: GetStudentProgressUc — запрет для чужого студента

- [x] Task: Добавить проверки авторизации в ActivateStreamUc, ArchiveStreamUc, CompleteStreamUc, GetStudentProgressUc `8f330a8`
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
