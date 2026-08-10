# 3. Пайплайн «Событие → Анкета → Метрики» + новые модули

**Назначение:** технический документ. Связующая ткань: как события в системе превращаются в анкеты, а анкеты — в метрики. Плюс два новых модуля: `peer-review` и `metrics`.

> **Родительский документ:** [Система сбора метрик](./metrics-system.md)
> **Связан с:** [1. Концепция метрик](./metrics-conception.md) — формулы агрегации
> **Связан с:** [2. Questionnaire + EventBus](./metrics-questionnaire-and-events.md) — движок анкет, EventBus, intention-паттерн

---

## Общий поток данных

```
stream (ModuleEnrollment.complete)
  │  addEvent(ModuleCompleted)
  │  → UC publishEvents
  ▼
EventBus ──> peer-review (подписчик)
                │  questionnaireFacade.createIntention() × N
                │  → возвращает intentionId + message
                │  → бот показывает кнопки студентам/ментору
                ▼
           questionnaire (пользователь нажимает кнопку)
                │  start → handleAction → ... → completed
                │  addEvent(QuestionnaireCompleted)
                │  → UC publishEvents
                ▼
           EventBus ──> metrics (подписчик)
                         │  извлекает metricScores
                         │  обновляет StudentMetrics
                         ▼
                      профиль студента
```

---

## Треки

### Трек 3.1 — Intention-паттерн в `questionnaire`

**Цель:** реализовать механизм «намерения» — анкета не стартует принудительно, а предлагается пользователю.

**Проблема:** сейчас `questionnaire.start()` сразу начинает анкету и захватывает ввод пользователя. Но для peer-review надо: студент завершил модуль → показать кнопку «Оценить напарника» → студент сам решает когда нажать.

**Решение — жизненный цикл через статусы агрегата:**

Вместо отдельной сущности `Intention` и `IntentionRepo`, агрегат анкеты получает новый статус `intention`:

```
intention → in_progress → completed/abandoned
```

**Фасад:**
- `createIntention(context, role, subjectId, respondentId)` → создаёт агрегат в статусе `intention` (пул = null), возвращает `{ questionnaireId, message }`
- `startMetric(questionnaireId, questionPool, triggerEvent?)` → переводит `intention` → `in_progress`, сохраняет снимок пула, возвращает первый вопрос

**Механика:**
1. `createIntention()` создаёт агрегат в статусе `intention` и возвращает `questionnaireId` + текст приглашения
2. Бот показывает пользователю приглашение с кнопкой
3. Когда пользователь нажимает кнопку → контроллер загружает пул вопросов (по `context` + `role`) → вызывает `startMetric(questionnaireId, questionPool)`
4. Агрегат переходит `intention` → `in_progress`, начинает анкету

**Преимущества:**
- Один агрегат, один `QuestionnaireRepo` — без дополнительных сущностей
- Естественный жизненный цикл через статусы
- Пул не нужен до фактического старта — `questionPool` остаётся `null` в статусе `intention`

---

### Трек 3.2 — События в `stream`

**Цель:** `stream` при завершении модуля студентом генерирует доменное событие.

**Где:** агрегат `ModuleEnrollmentAr` (или его аналог в `packages/stream`).

**Изменения:**
- `ArMeta.events` дополняется типом `ModuleCompletedEvent`
- Метод `complete()` (или аналогичный) после перехода в `advanced`/`not_advanced` кладёт событие:

```typescript
this.addEvent({
  eventId: crypto.randomUUID(),
  eventType: 'module.completed',
  occurredAt: isoNow(),
  aggregateType: 'ModuleEnrollment',
  aggregateId: this.state.uuid,
  payload: {
    studentId: this.state.studentId,   // telegramId студента
    courseId: this.state.courseId,
    moduleId: this.state.moduleId,
    outcome: this.state.outcome,       // "advanced" | "not_advanced" | "abandoned"
    completedAt: isoNow(),
  },
});
```

- UC после `repo.save()` → `publishEvents(ar)`.

**Важно:** событие генерируется только при финальном переходе (advanced/not_advanced/abandoned), не при промежуточных шагах.

**Местоположение:** `packages/stream/src/domain/...` — найти текущий агрегат зачисления и расширить.

---

### Трек 3.3 — Модуль `peer-review`

**Цель:** новый пакет, отвечающий за кросс-оценки, парное программирование, код-ревью.

**Ответственности:**
- Подписка на `module.completed` → оркестрация intentions для группы
- Управление сессиями парного программирования («кто смотрит», «кто программирует»)
- Запуск анкет по завершении парного урока

**Структура пакета:**

```
packages/peer-review/src/
  domain/
    module.ts                  — PeerReviewApiModuleMeta, PeerReviewApiModuleResolver
    review-session/
      entity.ts                — ReviewSession (type: pair_programming | code_review | cross_review)
      a-root.ts                — PeerReviewAr
      repo.ts                  — PeerReviewRepo (интерфейс)
      policy.ts
    index.ts
  api/
    module.ts                  — PeerReviewApiModule
    review-session/
      create-session-uc.ts
      complete-session-uc.ts
      orchestrate-module-reviews-uc.ts  — оркестратор при module.completed
  infra/
    db/
      review-session-json-repo.ts
    peer-review-bootstrap.ts   — подписки на EventBus
  ui/bot/
    controller/                — PeerReviewController
    types.ts
  index.ts
```

**Оркестрация при `module.completed`:**

```typescript
// OrchestrateModuleReviewsUc — вызывается из подписчика EventBus
async execute(event: ModuleCompletedEvent): Promise<void> {
  const { courseId, studentId, moduleId } = event.payload;

  // 1. Найти группу (всех студентов того же потока)
  const group = await this.resolve.streamFacade.getGroupByCourseId(courseId);

  // 2. Для каждой ПАРЫ студентов (A←B, B←A) — создать intention student_student
  for (const reviewer of group) {
    if (reviewer.telegramId === studentId) continue; // не себе

    await this.resolve.questionnaireFacade.createIntention({
      context: 'module_completed',
      role: 'student_student',
      subjectId: studentId,
      respondentId: reviewer.telegramId,
      triggerEvent: { type: 'module_completed', aggregateId: event.aggregateId },
    });
  }

  // 3. Для ментора потока — intention на mentor_student
  const mentor = await this.resolve.streamFacade.getMentor(courseId);
  await this.resolve.questionnaireFacade.createIntention({
    context: 'module_completed',
    role: 'mentor_student',
    subjectId: studentId,
    respondentId: mentor.telegramId,
    triggerEvent: { type: 'module_completed', aggregateId: event.aggregateId },
  });
}
```

**Парное программирование:**
- `PeerReviewAr` управляет сессией: `start(reviewerId, programmerId, lessonId)` → `complete(outcome)`
- При `complete()` → создаёт intention с `context: 'pair_programming', role: 'student_student'` для «смотревшего» оценить «программировавшего»
- Пул вопросов для `pair_programming` фокусируется на самостоятельности (ключевой вопрос: «писал ли код сам, без ИИ»)

**Контроллер бота:**
- Показывает кнопки «Оценить напарника», «Оценить студента» (из intentions)
- При нажатии — перенаправляет в questionnaire flow

---

### Трек 3.4 — Модуль `metrics`

**Цель:** новый пакет, хранящий и агрегирующий метрики студента.

**Ответственности:**
- Подписка на `questionnaire.completed` → извлечение `metricScores` → обновление `StudentMetrics`
- Потребление авто-метрик от `stream` (посещаемость, скорость)
- API для запроса профиля студента

**Структура пакета:**

```
packages/metrics/src/
  domain/
    module.ts                  — MetricsApiModuleMeta, MetricsApiModuleResolver
    student-metrics/
      entity.ts                — StudentMetrics (студент, scores по категориям, история)
      a-root.ts                — StudentMetricsAr
      repo.ts                  — StudentMetricsRepo (интерфейс)
      policy.ts
      types.ts                 — MetricScore, CategoryScore, StudentProfile
    index.ts
  api/
    module.ts                  — MetricsApiModule
    student-metrics/
      update-metrics-uc.ts     — подписчик на QuestionnaireCompleted
      get-profile-uc.ts        — запрос профиля студента
      ingest-auto-metrics-uc.ts — приём авто-метрик от stream
  infra/
    db/
      student-metrics-json-repo.ts
    metrics-bootstrap.ts       — подписки на EventBus
  ui/
    bot/controller/            — MetricsController (показ профиля)
  index.ts
```

**Модель `StudentMetrics`:**

```typescript
interface MetricScore {
  category: string;
  subcategory: string;
  score: number;           // средневзвешенный балл по анкетам
  sampleSize: number;      // количество анкет
  lastUpdated: string;
}

interface StudentMetrics {
  uuid: string;
  studentTelegramId: number;
  professionalSkills: MetricScore[];  // разбивка по подкатегориям профессионализма
  teamSkills: MetricScore[];          // разбивка по подкатегориям командных
  personalSkills: MetricScore[];      // разбивка по подкатегориям личностных
  mentorRecommendation?: string;      // текст рекомендации ментора
  peerRecommendations: string[];      // рекомендации студентов
  updatedAt: string;
}
```

**Агрегация при `questionnaire.completed`:**

```typescript
// UpdateMetricsUc
async execute(event: QuestionnaireCompletedEvent): Promise<void> {
  const { subjectId, metricScores } = event.payload;
  if (!metricScores) return;  // не метрическая анкета (например onboarding)

  let metrics = await this.resolve.studentMetricsRepo.getByTelegramId(subjectId);
  if (!metrics) {
    metrics = StudentMetricsAr.create(subjectId);
  }

  const ar = new StudentMetricsAr(metrics);
  ar.ingestScores(metricScores, event.payload.context);
  // ar пересчитывает средние, обновляет sampleSize

  await this.resolve.studentMetricsRepo.save(ar.state);
}
```

**Интеграция со `stream`:**
- `stream` может напрямую дёргать `MetricsFacade.ingestAutoMetrics(telegramId, autoMetrics)`
- Или публиковать `AutoMetricsUpdated` событие (более единообразно с шиной)

**Витрина профиля** (см. Документ 1, §5):
- `GetProfileUc` собирает все метрики + рекомендации
- `MetricsController` рендерит в MarkdownV2 (или текст) для бота

---

## Зависимости между модулями (финальная схема)

```
┌──────────┐
│  core    │  EventBus (интерфейс), InProcEventBus, Aggregate API
└────┬─────┘
     │ зависит
     ▼
┌──────────────┐     ┌─────────────────┐
│ onboarding   │────>│  questionnaire  │
│ (желания,    │     │  (движок анкет) │
│  привязка к  │     │                 │
│  курсам,     │     │ • BaseAr        │
│  роль после  │     │ • MetricAr      │
│  анкеты)     │     │ • MetricAr      │
└──────────────┘     │ • QuestionPool  │
                     └────────┬────────┘
                              │ зависит
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
┌────────────────┐  ┌────────────────┐  ┌──────────────────┐
│  peer-review   │  │    metrics     │  │     stream       │
│                │  │                │  │                  │
│ • подписка на  │  │ • подписка на  │  │ • генерирует     │
│   ModuleComp-  │  │   Questionn-   │  │   ModuleComp-    │
│   leted        │  │   aireComp-    │  │   leted          │
│ • оркестрирует │  │   leted        │  │ • авто-метрики   │
│   intentions   │  │ • StudentMet-  │  │                  │
│ • парное прог. │  │   ricsAr       │  │                  │
└────────────────┘  └────────────────┘  └──────────────────┘
```

**Ключевые правила зависимостей:**
- `questionnaire` НЕ зависит от `metrics`, `peer-review`, `stream`
- `peer-review` зависит от `questionnaire` (фасад), `stream` (фасад для группы), `user` (фасад)
- `metrics` зависит от `questionnaire` (читает metricScores из событий)
- `stream` НЕ зависит от `peer-review` или `metrics` (только публикует события)

---

## Связанные документы

- [Система сбора метрик (родитель)](./metrics-system.md)
- [1. Концепция метрик](./metrics-conception.md) — формулы агрегации, витрина
- [2. Questionnaire + EventBus](./metrics-questionnaire-and-events.md) — движок анкет, EventBus, intention
- [DDD API](../.pi/skills/ddd-api/SKILL.md) — UseCase, Module, BotUserStory
- [DDD Naming](../.pi/skills/ddd-naming/SKILL.md) — именование пакетов, файлов
- [Границы доменной логики](./code_styleguides/domain-boundaries.md) — межмодульные взаимодействия
- [Архитектурная эволюция](./archive/mentor_tools_20260713/architecture-evolution.md) — контекст Релизов 1–3 (в архиве)
