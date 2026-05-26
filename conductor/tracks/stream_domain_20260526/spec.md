# Stream — Модуль потока курсов

## Обзор

Модуль `@u7-scl/stream` реализует доменную модель учебного **потока** — запуска курса с конкретными датами, ментором и группой студентов.

Поток связывает студентов и ментора с образовательным контентом, задаёт темп обучения и отслеживает прогресс каждого студента через полную историю прохождения.

MVP: только доменный слой. Entity, Aggregate, Repo-интерфейс, Policy, Commands. Без UseCase/API-слоя.

---

## Функциональные требования

### FR-1: Создание потока
- Создаётся ментором на основе курса (или модуля курса)
- При создании делается **снимок структуры** (`contentSnapshot`) — полное дерево: проекты → уроки → stepIds
- Поток после создания живёт независимо от изменений курса
- Параметры: `title`, `description`, `mentorId`, `targetType`, `targetId`, `startDate`, а также поля-снимки из курса (`goal`, `result`, `rules`, `additional`, `targetAudience`)
- Статус при создании: `enrollment`

### FR-2: Снимок контента (contentSnapshot)
- Содержит полное дерево: `[{ projectId, projectTitle, lessons: [{ lessonId, lessonTitle, stepIds[] }] }]`
- Порядок элементов задаёт порядок прохождения
- Используется для навигации: `StreamAr.findNextStep(currentStepId)` обходит дерево в глубину и возвращает следующий шаг

### FR-3: Запись студента в поток
- Создаётся **отдельный агрегат** `StreamStudentAr`
- Параметры: `streamId`, `userId`
- Начальный статус: `active`, `currentStepId` = первый шаг из снимка
- Сохраняется через `StreamStudentRepo`

### FR-4: Прохождение потока — жизненный цикл шага
`StreamStudentAr` управляет прохождением шагов:

| Операция | Описание |
|---|---|
| `issueStep(stepId)` | Выдать шаг студенту → статус `issued` в StepRecord |
| `completeStep(stepId)` | Завершить шаг → статус `completed` |

Каждая операция создаёт/обновляет `StepRecord` с метками времени.

### FR-5: Навигация между шагами
`StreamDs.completeStep(stream, student)` координирует:

1. Студент завершает шаг → `student.completeStep(stepId)`
2. `stream.findNextStep(stepId)` — обходит `contentSnapshot`, ищет следующий шаг
3. Если следующий шаг есть → `student.issueStep(nextStepId)`, возвращает результат с уровнем (`step` | `lesson` | `project`)
4. Если шагов больше нет → студент завершает поток (`student.complete()`), результат: `level: 'stream'`

### FR-6: Статусы потока
```
enrollment → active → completed
                ↓         ↓
             archived  archived
```
- `enrollment` → `active`: запуск, ментор
- `active` → `completed`: завершён, ментор
- любой → `archived`: архив, ментор

### FR-7: Политики доступа
- `canCreate`: MENTOR
- `canRead`: все (если `active`/`completed`) + `mentorId`/ADMIN (все статусы)
- `canEdit`: `mentorId` или ADMIN

---

## Модель данных

### Агрегат StreamAr

```
Stream {
  uuid: string
  title: string
  description: string
  mentorId: string
  targetType: 'course' | 'module'
  targetId: string
  startDate: string (ISO)
  status: StreamStatus

  goal?: string
  result?: string
  rules?: string
  additional?: string
  targetAudience?: string

  contentSnapshot: {
    projectId: string
    projectTitle: string
    lessons: {
      lessonId: string
      lessonTitle: string
      stepIds: string[]
    }[]
  }[]

  createdAt: string (ISO)
  updatedAt?: string (ISO)
}
```

### Агрегат StreamStudentAr

```
StreamStudent {
  uuid: string
  streamId: string
  userId: string
  enrolledAt: string (ISO)
  status: 'active' | 'completed' | 'dropped'
  currentStepId: string

  steps: {
    stepId: string
    status: 'issued' | 'completed'
    issuedAt: string (ISO)
    completedAt?: string (ISO)
  }[]

  createdAt: string (ISO)
  updatedAt?: string (ISO)
}
```

### StepRecord — жизненный цикл

```
issued → completed
```

### CompletionResult (тип, не сущность)

```
{ level: 'step'; currentStepId: string }
| { level: 'lesson'; currentStepId: string; completedLessonId: string }
| { level: 'project'; currentStepId: string; completedProjectId: string }
| { level: 'stream'; completed: true }
```

---

## Команды MVP (домен)

### StreamAr
| Команда | Метод | Описание |
|---|---|---|
| `create-stream` | `static create(cmd, snapshot)` | Создать поток |
| `find-next-step` | `findNextStep(currentStepId)` | Найти следующий шаг в снимке |

### StreamStudentAr
| Команда | Метод | Описание |
|---|---|---|
| `enroll-student` | `static enroll(streamId, userId, currentStepId)` | Записать в поток |
| `issue-step` | `issueStep(stepId)` | Выдать шаг |
| `complete-step` | `completeStep(stepId)` | Завершить шаг |

### StreamDs (domain service)
| Операция | Описание |
|---|---|
| `completeStep(stream, student)` | Координирует завершение шага + навигацию |

---

## Интерфейсы репозиториев

### StreamRepo
```
save(stream: Stream): Promise<void>
getByUuid(uuid: string): Promise<Stream | undefined>
getAll(filter?: StreamListFilter): Promise<Stream[]>
```

### StreamStudentRepo
```
save(student: StreamStudent): Promise<void>
getByUuid(uuid: string): Promise<StreamStudent | undefined>
getByStream(streamId: string): Promise<StreamStudent[]>
getByUser(userId: string): Promise<StreamStudent[]>
```

---

## Критерии приёмки

- [ ] `StreamAr.create()` создаёт поток с корректным `contentSnapshot`, статус `enrollment`
- [ ] `StreamAr.findNextStep()` правильно обходит дерево: шаг→урок→проект→конец
- [ ] `StreamStudentAr.enroll()` создаёт студента с `currentStepId` = первому шагу
- [ ] `StreamStudentAr.issueStep/completeStep` корректно создают/обновляют `StepRecord`
- [ ] `StreamDs.completeStep()` координирует: завершил шаг → нашёл следующий → выдал
- [ ] `StreamDs.completeStep()` при завершении последнего шага помечает студента `completed`
- [ ] Все Valibot-схемы проходят/падают на корректных/некорректных данных
- [ ] `StreamPolicy` проверяет права по ролям и авторству
- [ ] Интерфейсы репозиториев определены

---

## За рамками MVP

- API/UseCase слой
- `removeStudent` (отчисление)
- `changeStreamStatus` (управление статусом потока)
- Связь с модулем `user` (импорт `UserPolicy`)
- Интеграция с ботом (UI-слой)
- Метрики аналитики на основе `StepRecord`
